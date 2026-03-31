import { Redis } from 'ioredis';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationModule } from '@/modules/collaboration/collaboration.module';
import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { ApiConfigModule } from './config.module';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    ApiConfigModule,
    RedisModule,
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: (redis: Redis) => ({
        connection: redis,
      }),
      inject: ['REDIS_CONNECTION'],
    }),
    QueueModule,
    AuthModule,
    UsersModule,
    DocumentsModule,
    CollaborationModule,
    MailModule,
  ],
  providers: [],
})
export class AppModule { }
