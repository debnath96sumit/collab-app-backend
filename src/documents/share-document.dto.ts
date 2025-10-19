import { IsEmail, IsEnum } from 'class-validator';
import { CollaboratorRole } from './document-collaborator.entity';

export class ShareDocumentDto {
  @IsEmail()
  email: string;

  @IsEnum(CollaboratorRole)
  permission: CollaboratorRole;
}

export class UpdateLinkAccessDto {
  @IsEnum(['public', 'restricted'])
  linkAccess: string;

  @IsEnum(CollaboratorRole)
  linkPermission: CollaboratorRole;
}

export class UpdateCollaboratorDto {
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}
