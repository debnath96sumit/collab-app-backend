import { InjectQueue } from '@nestjs/bullmq';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Queue } from 'bullmq';
import { Socket } from 'socket.io';
import { DocumentsService } from '@/modules/documents/documents.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectQueue('document-edits') private editsQueue: Queue,
    private readonly documentsService: DocumentsService,
  ) { }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', { id: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinDocument')
  handleJoin(@MessageBody() docId: string, @ConnectedSocket() client: Socket) {
    client.join(docId);
    client.emit('joined', { docId });
    console.log(`Client ${client.id} joined document ${docId}`);
  }

  @SubscribeMessage('editDocument')
  async handleEdit(
    @MessageBody() data: { docId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast real-time updates
    client.to(data.docId).emit('documentUpdated', data.content);

    // Queue persistence job
    await this.editsQueue.add('save-edit', {
      docId: data.docId,
      content: data.content,
    });
    console.log(`📩 Queued edit for doc ${data.docId}`);
  }

  @SubscribeMessage('renameDocument')
  async handleRename(
    @MessageBody() data: { docId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Save to DB
    await this.documentsService.update(data.docId, { title: data.name });

    // Broadcast to all others in room
    client.to(data.docId).emit('documentRenamed', data.name);
  }
  @SubscribeMessage('cursor-position')
  handleCursorPosition(
    client: Socket,
    payload: { documentId: string; position: number; userId: string },
  ) {
    client.to(payload.documentId).emit('cursor-update', {
      position: payload.position,
      userId: payload.userId,
      socketId: client.id,
    });
  }
}
