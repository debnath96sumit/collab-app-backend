import { CollaboratorRole, LinkAccess } from '@/common/enum/common.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @ApiProperty({
    example: 'Document Title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class UpdateLinkSettingsDto {
  @ApiProperty({
    enum: LinkAccess,
    example: LinkAccess.RESTRICTED,
  })
  @IsEnum(LinkAccess)
  linkAccess: LinkAccess;

  @ApiProperty({
    enum: CollaboratorRole,
    example: CollaboratorRole.VIEWER,
  })
  @IsEnum(CollaboratorRole)
  linkPermission: CollaboratorRole;
}
