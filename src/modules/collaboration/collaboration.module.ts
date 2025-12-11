import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationGateway } from './gateway/collaboration.gateway';
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
