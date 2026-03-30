import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorRole } from '@/common/enum/common.enum';

export class AddCollaboratorDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: CollaboratorRole })
  @IsEnum(CollaboratorRole)
  role: CollaboratorRole;
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
