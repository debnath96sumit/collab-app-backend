import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum LinkAccess {
  RESTRICTED = 'restricted',
  PUBLIC = 'public',
}

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(LinkAccess)
  linkAccess?: LinkAccess;
}
