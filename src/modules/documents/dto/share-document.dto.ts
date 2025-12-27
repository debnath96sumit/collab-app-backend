import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole } from '../entities/document-collaborator.entity';

export class ShareDocumentDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: CollaboratorRole })
  @IsEnum(CollaboratorRole)
  permission: CollaboratorRole;
}

export class UpdateLinkAccessDto {
  @ApiProperty({ enum: ['public', 'restricted'] })
  @IsEnum(['public', 'restricted'])
  linkAccess: string;

  @ApiProperty({ enum: CollaboratorRole })
  @IsEnum(CollaboratorRole)
  linkPermission: CollaboratorRole;
}

export class UpdateCollaboratorDto {
  @ApiProperty({ enum: CollaboratorRole })
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
}
