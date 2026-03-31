import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { DocumentsService } from '@/modules/documents/documents.service';
import { DocumentsController } from '@/modules/documents/documents.controller';
import { DocumentCollaborator } from '@/modules/documents/entities/document-collaborator.entity';
import { UsersModule } from '@/modules/users/users.module';
import { DocumentCollaboratorRepository } from './repositories/document-collaborator.repository';
import { DocumentRepository } from './repositories/document.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentCollaborator]),
    UsersModule
  ],
  providers: [
    DocumentsService,
    DocumentCollaboratorRepository,
    DocumentRepository,
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService, TypeOrmModule, DocumentRepository, DocumentCollaboratorRepository],
})
export class DocumentsModule { }
