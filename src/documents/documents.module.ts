import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './document.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentVersion } from './document-version.entity';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion]),
    BullModule.registerQueue({
      name: 'document-edits',
    }),
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService, TypeOrmModule],
})
export class DocumentsModule {}
