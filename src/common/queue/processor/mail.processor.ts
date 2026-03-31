import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";

@Processor("mail-queue", {
  concurrency: 1,
  limiter: { max: 1, duration: 30000 },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  constructor() {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name === "send-email") {
      console.log("job.data", job.data);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.log(`✅ Mail job completed: ${job.id}`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, err: Error) {
    this.logger.error(`❌ Mail job failed: ${job.id}`, err);
  }
}
