import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Document } from '@/modules/documents/entities/document.entity';
import { DocumentRepository } from '@/modules/documents/repositories/document.repository';

export type DocumentJob = Job<{ docId: string; content: string }>;
@Processor('document-edits')
export class DocumentProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Document)
    private docRepo: DocumentRepository,
  ) {
    super();
  }

  async process(job: DocumentJob) {
    const { docId, content } = job.data;

    const document = await this.docRepo.findOneById(docId);
    console.log(`📝 Processing job for doc ${docId}`);

    if (!document) {
      throw new Error(`Document ${docId} not found`);
    }

    document.content = content;
    await this.docRepo.updateById(docId, document);

    console.log(`✅ Saved version for doc ${docId}`);
  }
}
