import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { DocumentVersion } from '@/modules/documents/entities/document-version.entity';
import { Document } from '@/modules/documents/entities/document.entity';
export type DocumentJob = Job<{ docId: string; content: string }>;
@Processor('document-edits')
export class DocumentProcessor extends WorkerHost {
  constructor(
    @InjectRepository(DocumentVersion)
    private versionRepo: Repository<DocumentVersion>,
    @InjectRepository(Document)
    private docRepo: Repository<Document>,
  ) {
    super();
  }

  async process(job: DocumentJob) {
    const { docId, content } = job.data;

    const document = await this.docRepo.findOneBy({ id: docId });
    console.log(`📝 Processing job for doc ${docId}`);

    if (!document) {
      throw new Error(`Document ${docId} not found`);
    }

    // Save a new version
    const version = this.versionRepo.create({
      document,
      content,
    });

    await this.versionRepo.save(version);

    // Also update the "current" doc
    document.content = content;
    await this.docRepo.save(document);

    console.log(`✅ Saved version for doc ${docId}`);
  }
}
