import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuração CORS (permissiva para desenvolvimento)
  app.enableCors({
    origin: true,  // Permite qualquer origem em desenvolvimento
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });
  
  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  // await app.listen(3000, '192.168.80.15' || 'localhost'); // Não funciona
  await app.listen(3000, '192.168.18.5');
  // await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
