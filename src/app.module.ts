import { Redis } from 'ioredis';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationModule } from '@/modules/collaboration/collaboration.module';
import { DocumentProcessor } from '@/queues/document.processor';
import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { ApiConfigModule } from './config.module';
import { RedisModule } from './common/redis/redis.module';
@Module({
  imports: [
    ApiConfigModule,
    RedisModule,
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => ({
        connection: redis,
      }),
      inject: ['REDIS_CONNECTION'],
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    CollaborationModule,
    MailModule,
  ],
  providers: [DocumentProcessor],
})
export class AppModule {}
