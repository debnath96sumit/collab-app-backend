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
  LinkAccess,
} from '@/common/enum/common.enum';
import { ApiResponse } from '@/common/types/api-response.type';
import { DocumentRepository } from './repositories/document.repository';
import { UserRepository } from '@/modules/users/user.repository';
import { DocumentCollaboratorRepository } from './repositories/document-collaborator.repository';
import { AuthenticatedUser } from '@/auth/types/authenticated-user.type';
import { Not } from 'typeorm';
import { generateUUID } from '@/common/utils/uuid';
import { AddCollaboratorDto } from './dto/share-document.dto';
import {
  UpdateDocumentDto,
  UpdateLinkSettingsDto,
} from './dto/update-document.dto';
import { UpdateCollaboratorRoleDto } from './dto/collaborator.dto';
import { OnEvent } from '@nestjs/event-emitter';
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
    userId: string,
  ): Promise<ApiResponse> {
    const shareToken = await generateUUID();

    const savedDocument = await this.documentRepo.create({
      ...createDocumentDto,
      shareToken,
      owner_id: userId,
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
    updateData: UpdateDocumentDto,
  ): Promise<ApiResponse> {
    const updatedDocument = await this.documentRepo.updateById(id, updateData);
    if (!updatedDocument) {
      throw new NotFoundException('Document not found');
    }
    return {
      statusCode: 200,
      message: 'Title updated successfully',
      data: updatedDocument,
    };
  }

  async updateDocSettings(
    id: string,
    updateData: UpdateLinkSettingsDto,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const document = await this.documentRepo.findOneById(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.owner_id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to update this document',
      );
    }
    const updatedDocument = await this.documentRepo.updateById(id, updateData);
    if (!updatedDocument) {
      throw new NotFoundException('Document not found');
    }
    return {
      statusCode: 200,
      message: 'Settings updated successfully',
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

  async addCollaborator(
    documentId: string,
    addCollaboratorDto: AddCollaboratorDto,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const document = await this.findDocumentWithPermission(
      documentId,
      user.id,
      CollaboratorRole.EDITOR,
    );

    if (addCollaboratorDto.role === CollaboratorRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign owner role to a collaborator',
      );
    }
    if (addCollaboratorDto.email === user.email) {
      throw new BadRequestException(
        'You cannot add yourself as a collaborator',
      );
    }

    const existingCollaborator =
      await this.collaboratorRepository.findByCondition({
        documentId,
        invitedEmail: addCollaboratorDto.email,
      });

    if (existingCollaborator) {
      if (existingCollaborator.status === CollaboratorStatus.ACTIVE) {
        throw new BadRequestException('User is already a collaborator');
      }

      if (
        existingCollaborator.status === CollaboratorStatus.PENDING &&
        existingCollaborator.expiresAt &&
        existingCollaborator.expiresAt > new Date()
      ) {
        throw new BadRequestException(
          'An invitation has already been sent to this email',
        );
      }

      await this.collaboratorRepository.remove(existingCollaborator.id);
    }

    const invitedUser = await this.userRepository.findByCondition({
      email: addCollaboratorDto.email,
    });

    if (invitedUser) {
      const collaborator = await this.collaboratorRepository.create({
        documentId,
        userId: invitedUser.id,
        invitedEmail: addCollaboratorDto.email,
        role: addCollaboratorDto.role,
        status: CollaboratorStatus.ACTIVE,
        joinedAt: new Date(),
      });

      try {
        await this.mailService.sendCollaborationNotification(
          addCollaboratorDto.email,
          document.title,
          invitedUser.username,
          user.username,
          document.id,
        );
      } catch (error) {
        console.log(error);
      }
      return {
        statusCode: 201,
        message: 'Collaborator added successfully',
        data: {
          id: collaborator.id,
          email: addCollaboratorDto.email,
          username: invitedUser.username,
          role: collaborator.role,
          status: collaborator.status,
        },
      };
    }

    const token = await generateUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const collaborator = await this.collaboratorRepository.create({
      documentId,
      invitedEmail: addCollaboratorDto.email,
      role: addCollaboratorDto.role,
      status: CollaboratorStatus.PENDING,
      token,
      expiresAt,
    });

    try {
      await this.mailService.sendInvitationEmail(
        addCollaboratorDto.email,
        document.title,
        token,
        user.username,
      );
    } catch (error) {
      console.log(error);
    }
    return {
      statusCode: 201,
      message: 'Invitation sent successfully',
      data: {
        id: collaborator.id,
        email: addCollaboratorDto.email,
        username: null,
        role: collaborator.role,
        status: collaborator.status,
      },
    };
  }

  async acceptInvitation(
    token: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const collaborator = await this.collaboratorRepository.findByCondition({
      token,
      status: CollaboratorStatus.PENDING,
    });
    if (!collaborator) {
      throw new NotFoundException('Invitation not found');
    }
    if (!collaborator.expiresAt || collaborator.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }
    if (collaborator.status === CollaboratorStatus.ACTIVE) {
      throw new BadRequestException('Invitation already accepted');
    }
    const updatedCollaborator = await this.collaboratorRepository.updateById(
      collaborator.id,
      {
        userId: user.id,
        status: CollaboratorStatus.ACTIVE,
        joinedAt: new Date(),
        token: null,
        expiresAt: null,
      },
    );
    return {
      statusCode: updatedCollaborator ? 200 : 400,
      message: updatedCollaborator
        ? 'Invitation accepted successfully'
        : 'Invitation not accepted',
      data: updatedCollaborator,
    };
  }

  async getCollaborators(
    documentId: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const document = await this.findDocumentWithPermission(
      documentId,
      user.id,
      CollaboratorRole.VIEWER,
    );
    const collaborators = await this.collaboratorRepository.findByCondition({
      documentId: document.id,
      status: CollaboratorStatus.ACTIVE,
    });
    return {
      statusCode: 200,
      message: 'Collaborators fetched successfully',
      data: collaborators,
    };
  }

  async validateInvitation(token: string): Promise<ApiResponse> {
    const collaborator = await this.collaboratorRepository.findByCondition(
      {
        token,
        status: CollaboratorStatus.PENDING,
      },
      {
        relations: ['document', 'document.owner'],
      },
    );
    if (!collaborator) {
      throw new NotFoundException('Invitation not found');
    }
    if (!collaborator.expiresAt || collaborator.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }
    if (collaborator.status === CollaboratorStatus.ACTIVE) {
      throw new BadRequestException('Invitation already accepted');
    }
    return {
      statusCode: 200,
      message: 'Invitation is valid',
      data: {
        email: collaborator.invitedEmail,
        role: collaborator.role,
        docTitle: collaborator.document.title,
        inviterName: collaborator.document.owner.username,
      },
    };
  }

  async updateCollaboratorRole(
    documentId: string,
    collabId: string,
    dto: UpdateCollaboratorRoleDto,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    await this.findDocumentWithPermission(
      documentId,
      user.id,
      CollaboratorRole.OWNER,
    );

    const collaborator = await this.collaboratorRepository.findByCondition({
      id: collabId,
      documentId,
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (collaborator.status !== CollaboratorStatus.ACTIVE) {
      throw new BadRequestException('Cannot update role of a pending collaborator');
    }

    const updated = await this.collaboratorRepository.updateById(collabId, {
      role: dto.role,
    });

    return {
      statusCode: 200,
      message: 'Collaborator role updated successfully',
      data: updated,
    };
  }

  async removeCollaborator(
    documentId: string,
    collabId: string,
    user: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const document = await this.findDocumentWithPermission(
      documentId,
      user.id,
      CollaboratorRole.OWNER,
    );

    const collaborator = await this.collaboratorRepository.findByCondition({
      id: collabId,
      documentId,
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (collaborator.userId === user.id) {
      await this.collaboratorRepository.remove(collabId);
      return {
        statusCode: 200,
        message: 'You have left the document',
        data: null,
      };
    }
    if (document.owner_id !== user.id) {
      throw new ForbiddenException('Only the owner can remove collaborators');
    }

    await this.collaboratorRepository.remove(collabId);

    return {
      statusCode: 200,
      message: 'Collaborator removed successfully',
      data: null,
    };
  }

  async getDocumentByShareToken(
    shareToken: string,
    user?: AuthenticatedUser,
  ): Promise<ApiResponse> {
    const document = await this.documentRepo.findByCondition({ shareToken });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (user && document.owner_id === user.id) {
      return {
        statusCode: 200,
        message: 'Document retrieved successfully',
        data: document,
      };
    }

    if (user) {
      const collaborator = await this.collaboratorRepository.findByCondition({
        documentId: document.id,
        userId: user.id,
        status: CollaboratorStatus.ACTIVE,
      });

      if (collaborator) {
        return {
          statusCode: 200,
          message: 'Document retrieved successfully',
          data: { ...document, accessRole: collaborator.role },
        };
      }
    }

    if (document.linkAccess === LinkAccess.RESTRICTED) {
      throw new ForbiddenException(
        'This document is restricted. Request access from the owner.',
      );
    }

    return {
      statusCode: 200,
      message: 'Document retrieved successfully',
      data: { ...document, accessRole: document.linkPermission },
    };
  }

  @OnEvent("document.edit.save")
  async handleDocumentEditSave(data: { docId: string; content: string; userId: string }) {
    const { docId, content, userId } = data;

    const document = await this.documentRepo.findOneById(docId);
    console.log(`📝 Processing job for doc ${docId}`);

    if (!document) {
      throw new Error(`Document ${docId} not found`);
    }

    document.content = content;
    await this.documentRepo.updateById(docId, document);

    console.log(`✅ Saved version for doc ${docId}`);
  }

  private async findDocumentWithPermission(
    documentId: string,
    userId: string,
    requiredRole: CollaboratorRole,
  ): Promise<Document> {
    const document = await this.documentRepo.findOneById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.owner_id === userId) {
      return document;
    }

    if (requiredRole === CollaboratorRole.OWNER) {
      throw new ForbiddenException(
        'Only the document owner can perform this action',
      );
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
