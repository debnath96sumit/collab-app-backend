import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

export type DocumentJob = Job<{ docId: string; content: string }>;

@Processor('document-edit-queue', { concurrency: 5 })
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  async process(job: DocumentJob) {
    if (job.name === "save-edit") {
      this.eventEmitter.emit("document.edit.save", job.data);
    } else {
      this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.log(`✅ PDF job completed: ${job.id}`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, err: Error) {
    this.logger.error(`❌ PDF job failed: ${job.id}`, err);
  }
}
