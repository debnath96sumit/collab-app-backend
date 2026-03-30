import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { DocumentsService } from '@/modules/documents/documents.service';
import { DocumentsController } from '@/modules/documents/documents.controller';
import { BullModule } from '@nestjs/bullmq';
import { DocumentCollaborator } from '@/modules/documents/entities/document-collaborator.entity';
import { UsersModule } from '@/modules/users/users.module';
import { DocumentCollaboratorRepository } from './repositories/document-collaborator.repository';
import { DocumentRepository } from './repositories/document.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentCollaborator]),
    BullModule.registerQueue({
      name: 'document-edits',
    }),
    UsersModule,
  ],
  providers: [
    DocumentsService,
    DocumentCollaboratorRepository,
    DocumentRepository,
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService, TypeOrmModule],
})
export class DocumentsModule {}
