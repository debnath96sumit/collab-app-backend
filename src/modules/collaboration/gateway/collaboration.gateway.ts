import { InjectQueue } from '@nestjs/bullmq';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Queue } from 'bullmq';
import { Socket, Server } from 'socket.io';
import { DocumentsService } from '@/modules/documents/documents.service';
import { CollaborationService } from '../collaboration.service';
import { REDIS_CONNECTION } from '@/common/redis/redis.provider';
import { Inject } from '@nestjs/common';

@WebSocketGateway({
  namespace: "/document-edits",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectQueue('document-edit-queue') private editsQueue: Queue,
    private readonly documentsService: DocumentsService,
    private readonly collaborationService: CollaborationService,
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
  ) { }

  afterInit(server: any) {
    const pubClient = this.redis;
    const subClient = pubClient.duplicate();
    server.server.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.IO Redis adapter initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const user = await this.collaborationService.authenticateSocket(client);
      client.data.user = user;
      console.log(`User connected: ${user.id} (socket: ${client.id})`);
    } catch (err) {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    const docId = client.data.docId;

    if (docId) {
      this.collaborationService.removeFromPresence(docId, user.id);
      this.server.to(docId).emit('presenceUpdated', this.collaborationService.getPresence(docId));
    }

    console.log(`User disconnected: ${user.id} (socket: ${client.id})`);
  }

  @SubscribeMessage('joinDocument')
  async handleJoin(
    @MessageBody() docId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    const hasAccess = await this.collaborationService.canAccessDocument(docId, user);
    if (!hasAccess) {
      client.emit('error', { message: 'You do not have access to this document' });
      return;
    }

    await client.join(docId);
    client.data.docId = docId;
    this.collaborationService.addToPresence(docId, user, client.id);

    // Tell the joining user who is already here
    client.emit('joined', {
      docId,
      presence: this.collaborationService.getPresence(docId),
    });

    // Tell everyone else in the room this user joined
    client.to(docId).emit('presenceUpdated', this.collaborationService.getPresence(docId));

    console.log(`User ${user.id} joined document ${docId}`);
  }

  @SubscribeMessage('editDocument')
  async handleEdit(
    @MessageBody() data: { docId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    client.to(data.docId).emit('documentUpdated', {
      content: data.content,
      editedBy: user.id,
    });

    await this.editsQueue.add(
      "save-edit",
      { docId: data.docId, content: data.content, userId: user.id }
    );
  }

  @SubscribeMessage('renameDocument')
  async handleRename(
    @MessageBody() data: { docId: string; newTitle: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    await this.documentsService.update(data.docId, { title: data.newTitle });

    client.to(data.docId).emit('documentRenamed', {
      newTitle: data.newTitle,
      renamedBy: user.id,
    });
  }

  @SubscribeMessage('leaveDocument')
  async handleLeave(
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const docId = client.data.docId;

    if (!docId) return;

    await client.leave(docId);

    this.collaborationService.removeFromPresence(docId, user.id);
    client.data.docId = null;

    // Notify remaining users
    this.server.to(docId).emit('presenceUpdated', this.collaborationService.getPresence(docId));

    console.log(`User ${user.id} left document ${docId}`);
  }

  @SubscribeMessage('cursor-position')
  handleCursorPosition(
    @MessageBody() payload: { documentId: string; position: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;

    client.to(payload.documentId).emit('cursor-update', {
      position: payload.position,
      userId: user.id,
      username: user.username,
      socketId: client.id,
    });
  }
}
