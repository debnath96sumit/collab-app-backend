import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { MailProcessor } from "./processor/mail.processor";
import { DocumentProcessor } from "./processor/document.processor";

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: "mail-queue",
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: {
            age: 3600,
            count: 1000,
          },
          removeOnFail: false,
        },
      },
      {
        name: "document-edit-queue",
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: {
            age: 3600,
            count: 1000,
          },
          removeOnFail: false,
        },
      },
    ),
    BullBoardModule.forRoot({
      route: "/admin/queues",
      adapter: ExpressAdapter,
    }),

    BullBoardModule.forFeature({
      name: "mail-queue",
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: "document-edit-queue",
      adapter: BullMQAdapter,
    }),
  ],
  providers: [MailProcessor, DocumentProcessor],
  exports: [BullModule],
})
export class QueueModule { }
