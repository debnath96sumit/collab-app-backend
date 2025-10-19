import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './document.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentVersion } from './document-version.entity';
import { BullModule } from '@nestjs/bullmq';
import { DocumentCollaborator } from './document-collaborator.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion, DocumentCollaborator]),
    BullModule.registerQueue({
      name: 'document-edits',
    }),
    UsersModule,
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService, TypeOrmModule],
})
export class DocumentsModule {}
