import { CollaboratorRole } from '@/common/enum/common.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateCollaboratorRoleDto {
    @ApiProperty({
        enum: CollaboratorRole,
        example: CollaboratorRole.VIEWER,
    })
    @IsEnum(CollaboratorRole)
    @IsNotEmpty()
    role: CollaboratorRole;
}