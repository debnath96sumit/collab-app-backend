import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationModule } from '@/modules/collaboration/collaboration.module';
import { DocumentProcessor } from '@/queues/document.processor';
import { AuthModule } from '@/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '@/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { ApiConfigModule } from './config.module';
@Module({
  imports: [
    ApiConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('BULL_HOST'),
          port: configService.get<number>('BULL_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    CollaborationModule,
    MailModule,
    InvitationModule,
  ],
  providers: [DocumentProcessor],
})
export class AppModule {}
