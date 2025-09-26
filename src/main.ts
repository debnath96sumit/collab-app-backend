import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173', // Specify allowed origin(s)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed HTTP methods
    allowedHeaders: 'Content-Type, Accept, Authorization', // Specify allowed headers
    credentials: true, // Allow sending cookies and authentication tokens
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Server running on port http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap().catch(console.error);
