import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration/collaboration.gateway';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/documents/documents.module';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-edits', // 👈 this must match InjectQueue()
    }),
    DocumentsModule,
  ],
  providers: [CollaborationGateway],
})
export class CollaborationModule { }
