import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow<string>('FRONTEND_URL'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  app.setGlobalPrefix('/api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (configService.getOrThrow('NODE_ENV') === 'development') {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle('API documentation')
      .setDescription('The API Documentation')
      .setVersion('1.0')
      .addTag('Auth')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('apidoc', app, document, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1, // Hides the Schemas section
      },
    });
  }

  await app.listen(configService.getOrThrow<number>('PORT'), () => {
    console.log(
      `Server is running on http://127.0.0.1:${configService.getOrThrow<number>('PORT')}/apidoc`,
    );
  });
}
bootstrap().catch(console.error);
