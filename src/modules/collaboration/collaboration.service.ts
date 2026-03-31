import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/users/user.repository';
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import { DocumentRepository } from '../documents/repositories/document.repository';
import { DocumentCollaboratorRepository } from '../documents/repositories/document-collaborator.repository';
import { CollaboratorStatus, LinkAccess } from '@/common/enum/common.enum';

interface PresenceUser {
    userId: string;
    username: string;
    socketId: string;
    joinedAt: Date;
}
@Injectable()
export class CollaborationService {
    private presence: Map<string, Map<string, PresenceUser>> = new Map();
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userRepository: UserRepository,
        private readonly documentRepo: DocumentRepository,
        private readonly collaboratorRepository: DocumentCollaboratorRepository,
    ) { }

    async authenticateSocket(client: Socket): Promise<AuthenticatedUser> {
        const token = client.handshake.auth?.token;

        if (!token) {
            throw new WsException('Missing authorization token');
        }

        const decoded = await this.jwtService.verifyAsync(token, {
            secret: this.configService.getOrThrow('JWT_SECRET'),
        });

        if (!decoded || !decoded.id || !decoded.exp) {
            throw new WsException('Invalid token payload');
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= decoded.exp) {
            throw new WsException('Token expired');
        }

        const user = await this.userRepository.findOneById(decoded.id);
        if (!user) {
            throw new WsException('User not found');
        }

        const { password, ...authenticatedUser } = user;
        return authenticatedUser;
    }

    async canAccessDocument(
        documentId: string,
        user: AuthenticatedUser,
    ): Promise<boolean> {
        const document = await this.documentRepo.findOneById(documentId);

        if (!document) return false;

        if (document.owner_id === user.id) return true;

        const collaborator = await this.collaboratorRepository.findByCondition({
            documentId,
            userId: user.id,
            status: CollaboratorStatus.ACTIVE,
        });

        if (collaborator) return true;

        if (document.linkAccess === LinkAccess.PUBLIC) return true;

        return false;
    }

    addToPresence(docId: string, user: AuthenticatedUser, socketId: string): void {
        if (!this.presence.has(docId)) {
            this.presence.set(docId, new Map());
        }

        this.presence.get(docId)!.set(user.id, {
            userId: user.id,
            username: user.username,
            socketId,
            joinedAt: new Date(),
        });
    }

    removeFromPresence(docId: string, userId: string): void {
        if (!this.presence.has(docId)) return;

        this.presence.get(docId)!.delete(userId);

        if (this.presence.get(docId)!.size === 0) {
            this.presence.delete(docId);
        }
    }

    getPresence(docId: string): PresenceUser[] {
        if (!this.presence.has(docId)) return [];
        return Array.from(this.presence.get(docId)!.values());
    }
}
