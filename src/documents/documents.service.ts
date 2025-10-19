import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Document } from './document.entity';
import {
  CollaboratorRole,
  CollaboratorStatus,
  DocumentCollaborator,
} from './document-collaborator.entity';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateDocumentDto } from './dto/create-document.dto';
import { errorResponse } from '../common/helpers/api-response.helper';
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(DocumentCollaborator)
    private collaboratorRepository: Repository<DocumentCollaborator>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  findAllByParams(params: FindManyOptions<Document>) {
    return this.documentRepo.find(params);
  }

  findOne(id: string) {
    return this.documentRepo.findOneBy({ id });
  }
  documentDetails(id: string) {
    return this.documentRepo.findOne({
      where: { id },
      relations: ['collaborators', 'collaborators.user'],
    });
  }

  async create(createDocumentDto: CreateDocumentDto, userId: number) {
    const shareToken = uuidv4();

    const document = this.documentRepo.create({
      ...createDocumentDto,
      shareToken,
      owner_id: userId,
      linkAccess: createDocumentDto.linkAccess || 'public',
    });

    const savedDocument = await this.documentRepo.save(document);
    if (!savedDocument) return null;
    const ownerCollab = this.collaboratorRepository.create({
      documentId: savedDocument.id,
      userId,
      role: CollaboratorRole.OWNER,
      status: CollaboratorStatus.ACTIVE,
    });

    await this.collaboratorRepository.save(ownerCollab);

    return savedDocument;
  }

  async update(id: string, updateData: Partial<Document>) {
    await this.documentRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    if (!doc) {
      return null;
    }
    return this.documentRepo.remove(doc);
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
      if (!document) return errorResponse('Document not found');

      const invitedUser = await this.userRepository.findOne({
        where: { email },
      });
      if (!invitedUser) {
        return errorResponse('User not found');
      }
      const existingCollab = await this.collaboratorRepository.findOne({
        where: {
          documentId,
          ...(invitedUser ? { userId: invitedUser.id } : { invitedEmail: email }),
        },
      });

      if (existingCollab) {
        return errorResponse( existingCollab.status === CollaboratorStatus.ACTIVE
          ? 'User is already a collaborator'
          : 'Invitation already sent'
        );
      }

      const collaborator = await this.collaboratorRepository.save({
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
    const document = await this.documentRepo.findOne({
      where: { id: documentId },
      relations: ['owner', 'collaborators'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.owner_id === userId) {
      return document;
    }

    const collaboration = await this.collaboratorRepository.findOne({
      where: { documentId, userId, status: CollaboratorStatus.ACTIVE },
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
