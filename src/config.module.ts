import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: (() => {
        const env = process.env.NODE_ENV;
        let envFile = '.env';
        if (env) {
          envFile = `.env.${env}`;
          Logger.log(
            `Using environment-specific file: ${envFile}`,
            'ConfigModule',
          );
        } else {
          envFile = '.env.production';
          Logger.log(
            `No NODE_ENV set, defaulting to: ${envFile}`,
            'ConfigModule',
          );
        }
        Logger.log(`Checking if file exists: ${envFile}`, 'ConfigModule');
        if (!existsSync(envFile)) {
          Logger.error(
            `Environment file '${envFile}' not found. Please create the file or set NODE_ENV to a valid environment.`,
            'ConfigModule',
          );
          process.exit(1);
        }
        Logger.log(
          `Environment file '${envFile}' loaded successfully`,
          'ConfigModule',
        );
        return envFile;
      })(),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // ❌ only for dev (don’t use in prod!)
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
})
export class ApiConfigModule {}
