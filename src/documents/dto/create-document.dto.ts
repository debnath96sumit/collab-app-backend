import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LinkAccess {
  RESTRICTED = 'restricted',
  PUBLIC = 'public',
}

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: LinkAccess })
  @IsOptional()
  @IsEnum(LinkAccess)
  linkAccess?: LinkAccess;
}
