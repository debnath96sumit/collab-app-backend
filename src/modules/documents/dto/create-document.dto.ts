import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title: string;
}
