import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Document } from '@/modules/documents/entities/document.entity';
import { MailService } from '@/mail/mail.service';
import { CreateDocumentDto } from '@/modules/documents/dto/create-document.dto';
import {
  CollaboratorRole,
  CollaboratorStatus,
} from '@/modules/documents/entities/document-collaborator.entity';
import { ApiResponse } from '@/common/types/api-response.type';
import { DocumentRepository } from './repositories/document.repository';
import { UserRepository } from '@/modules/users/user.repository';
import { DocumentCollaboratorRepository } from './repositories/document-collaborator.repository';
import { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import { InvitationStatus } from '@/modules/invitation/entities/invitation.entity';
import { InvitationRepository } from '@/modules/invitation/repositories/invitation.repository';
import { ShareDocumentDto } from './dto/share-document.dto';
import { Not } from 'typeorm';
import { generateUUID } from '@/common/utils/uuid';
@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly collaboratorRepository: DocumentCollaboratorRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly invitationRepo: InvitationRepository,
  ) {}

  async getMyDocs(user: AuthenticatedUser): Promise<ApiResponse> {
    const userId = user.id;
    const myDocs = await this.documentRepo.findAllByCondition({
      owner_id: userId,
    });
    const sharedWithMe = await this.collaboratorRepository.findAllByCondition(
      {
        userId,
        status: CollaboratorStatus.ACTIVE,
        role: Not(CollaboratorRole.OWNER),
      },
      {
        relations: ['document'],
      },
    );
    return {
      statusCode: 200,
      message: 'Documents fetched successfully',
      data: { myDocs, sharedWithMe: sharedWithMe.map((doc) => doc.document) },
    };
  }

  async documentDetails(id: string) {
    const doc = await this.documentRepo.getDocumentFullDetails(id);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return {
      statusCode: 200,
      message: 'Document fetched successfully',
      data: doc,
    };
  }

  async create(
    createDocumentDto: CreateDocumentDto,
    userId: number,
  ): Promise<ApiResponse> {
    const shareToken = await generateUUID();

    const savedDocument = await this.documentRepo.create({
      ...createDocumentDto,
      shareToken,
      owner_id: userId,
      linkAccess: createDocumentDto.linkAccess || 'public',
    });

    if (!savedDocument) {
      throw new BadRequestException('Document not created');
    }
    await this.collaboratorRepository.create({
      documentId: savedDocument.id,
      userId,
      role: CollaboratorRole.OWNER,
      status: CollaboratorStatus.ACTIVE,
    });

    return {
      statusCode: 201,
      message: 'Document created successfully',
      data: savedDocument,
    };
  }

  async update(
    id: string,
    updateData: Partial<Document>,
  ): Promise<ApiResponse> {
    const updatedDocument = await this.documentRepo.updateById(id, updateData);
    if (!updatedDocument) {
      throw new NotFoundException('Document not found');
    }
    return {
      statusCode: 200,
      message: 'Document updated successfully',
      data: updatedDocument,
    };
  }

  async remove(id: string) {
    const doc = await this.documentRepo.findOneById(id);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return await this.documentRepo.remove(id);
  }

  async shareDocument(
    documentId: string,
    shareDto: ShareDocumentDto,
    requestUserId: number,
  ): Promise<ApiResponse> {
    const document = await this.findDocumentWithPermission(
      documentId,
      requestUserId,
      CollaboratorRole.OWNER,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const inviter = await this.userRepository.findByCondition({
      id: requestUserId,
    });

    if (!inviter) {
      throw new NotFoundException('User not found');
    }
    const existingUser = await this.userRepository.findByCondition({
      email: shareDto.email,
    });

    if (existingUser) {
      const existingCollab = await this.collaboratorRepository.findByCondition({
        documentId,
        userId: existingUser.id,
      });

      if (existingCollab) {
        throw new BadRequestException('User is already a collaborator');
      }

      const collaborator = await this.collaboratorRepository.create({
        documentId,
        userId: existingUser.id,
        role: shareDto.permission,
        status: CollaboratorStatus.ACTIVE,
      });

      await this.mailService.sendCollaborationNotification(
        shareDto.email,
        document.title,
        existingUser.username,
        inviter.username,
        document.shareToken,
      );

      return {
        statusCode: 200,
        message: 'Invitation sent successfully',
        data: {
          id: collaborator.id,
          email: shareDto.email,
          name: existingUser.username,
          role: shareDto.permission,
          status: CollaboratorStatus.ACTIVE,
        },
      };
    } else {
      // User doesn't exist - create invitation

      // Check if invitation already exists
      const existingInvitation = await this.invitationRepo.findByCondition({
        email: shareDto.email,
        documentId,
        status: InvitationStatus.PENDING,
      });

      if (existingInvitation) {
        throw new BadRequestException('Invitation already sent to this email');
      }

      // Create invitation
      const invitation = await this.invitationRepo.create({
        email: shareDto.email,
        role: shareDto.permission,
        documentId,
        inviterId: requestUserId,
      });

      // Send invitation email
      await this.mailService.sendInvitationEmail(
        shareDto.email,
        document.title,
        invitation.token,
        inviter.username,
      );

      return {
        statusCode: 200,
        message: 'Invitation sent successfully',
        data: {
          id: invitation.id,
          email: shareDto.email,
          name: null,
          role: shareDto.permission,
          status: 'pending',
        },
      };
    }
  }

  private async findDocumentWithPermission(
    documentId: string,
    userId: number,
    requiredRole: CollaboratorRole,
  ): Promise<Document> {
    const document = await this.documentRepo.findOneById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.owner_id === userId) {
      return document;
    }

    const collaboration = await this.collaboratorRepository.findByCondition({
      documentId,
      userId,
      status: CollaboratorStatus.ACTIVE,
    });

    if (!collaboration) {
      throw new ForbiddenException('You do not have access to this document');
    }

    const roleHierarchy = {
      [CollaboratorRole.OWNER]: 4,
      [CollaboratorRole.EDITOR]: 3,
      [CollaboratorRole.COMMENTER]: 2,
      [CollaboratorRole.VIEWER]: 1,
    };

    if (roleHierarchy[collaboration.role] < roleHierarchy[requiredRole]) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return document;
  }
}
