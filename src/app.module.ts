import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from './documents/documents.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { DocumentProcessor } from './queues/document.processor';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // your DB username
      password: 'postgres', // your DB password
      database: 'collab_app', // database name
      autoLoadEntities: true,
      synchronize: true, // ❌ only for dev (don’t use in prod!)
    }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    DocumentsModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService, DocumentProcessor],
})
export class AppModule {}
