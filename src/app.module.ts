import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationModule } from '@/modules/collaboration/collaboration.module';
import { DocumentProcessor } from '@/queues/document.processor';
import { AuthModule } from '@/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '@/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { InvitationModule } from './modules/invitation/invitation.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // ❌ only for dev (don’t use in prod!)
      }),
      inject: [ConfigService],
    }),
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
