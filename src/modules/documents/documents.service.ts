import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { MailService } from '@/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateDocumentDto } from '@/modules/documents/dto/create-document.dto';
import { CollaboratorRole, CollaboratorStatus } from '@/modules/documents/entities/document-collaborator.entity';
import { ApiResponse } from '@/common/types/api-response.type';
import { DocumentRepository } from './repositories/document.repository';
import { UserRepository } from '../users/user.repository';
import { DocumentCollaboratorRepository } from './repositories/document-collaborator.repository';
import { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly collaboratorRepository: DocumentCollaboratorRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) { }

  async getMyDocs(user: AuthenticatedUser): Promise<ApiResponse> {
    const userId = user.id;
    const docs = await this.documentRepo.findAllByCondition({
      owner_id: userId,
    });
    return {
      statusCode: 200,
      message: 'Documents fetched successfully',
      data: docs,
    }
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
    }
  }

  async create(createDocumentDto: CreateDocumentDto, userId: number): Promise<ApiResponse> {
    const shareToken = uuidv4();

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
    }
  }

  async update(id: string, updateData: Partial<Document>): Promise<ApiResponse> {
    const updatedDocument = await this.documentRepo.updateById(id, updateData);
    if (!updatedDocument) {
      throw new NotFoundException('Document not found');
    }
    return {
      statusCode: 200,
      message: 'Document updated successfully',
      data: updatedDocument,
    }
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
    email: string,
    permission: CollaboratorRole,
    requestUserId: number,
  ) {
    try {
      const document = await this.findDocumentWithPermission(
        documentId,
        requestUserId,
        CollaboratorRole.OWNER,
      );
      if (!document) throw new NotFoundException('Document not found');

      const invitedUser = await this.userRepository.findOneById(email);
      if (!invitedUser) {
        throw new NotFoundException('User not found');
      }
      const existingCollab = await this.collaboratorRepository.findByCondition({
        documentId,
        ...(invitedUser ? { userId: invitedUser.id } : { invitedEmail: email }),
      });

      if (existingCollab) {
        throw new ForbiddenException(existingCollab.status === CollaboratorStatus.ACTIVE
          ? 'User is already a collaborator'
          : 'Invitation already sent'
        );
      }

      const collaborator = await this.collaboratorRepository.create({
        documentId,
        userId: invitedUser.id,
        invitedEmail: email,
        role: permission,
        status: invitedUser
          ? CollaboratorStatus.PENDING
          : CollaboratorStatus.PENDING,
      });

      await this.mailService.sendInvitationEmail(
        email,
        document.title,
        document.shareToken,
      );

      return {
        id: collaborator.id,
        email,
        name: invitedUser.username,
        role: permission,
        status: CollaboratorStatus.PENDING,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  private async findDocumentWithPermission(
    documentId: string,
    userId: number,
    requiredRole: CollaboratorRole,
  ) {
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
