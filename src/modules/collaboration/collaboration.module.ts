import { Module } from '@nestjs/common';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { CollaborationGateway } from './gateway/collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
import { QueueModule } from '@/common/queue/queue.module';
@Module({
  imports: [
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
    UsersModule,
    QueueModule,
  ],
  providers: [CollaborationGateway, CollaborationService],
})
export class CollaborationModule { }
