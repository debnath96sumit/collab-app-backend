import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { DocumentVersion } from '@/modules/documents/entities/document-version.entity';
import { Document } from '@/modules/documents/entities/document.entity';
import { DocumentRepository } from '@/modules/documents/repositories/document.repository';
import { DocumentVersionRepository } from '@/modules/documents/repositories/document-version.repository';

export type DocumentJob = Job<{ docId: string; content: string }>;
@Processor('document-edits')
export class DocumentProcessor extends WorkerHost {
  constructor(
    @InjectRepository(DocumentVersion)
    private versionRepo: DocumentVersionRepository,
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

    // Save a new version
    await this.versionRepo.create({
      document,
      content,
    });

    // Also update the "current" doc
    document.content = content;
    await this.docRepo.updateById(docId, document);

    console.log(`✅ Saved version for doc ${docId}`);
  }
}
