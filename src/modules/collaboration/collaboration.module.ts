import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationGateway } from './gateway/collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-edits', // 👈 this must match InjectQueue()
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.getOrThrow("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.getOrThrow("JWT_ACCESS_EXPIRES_IN"),
        },
      }),
      inject: [ConfigService],
    }),
    DocumentsModule,
    UsersModule
  ],
  providers: [CollaborationGateway, CollaborationService],
})
export class CollaborationModule { }
