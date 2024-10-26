import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { CustomExceptionFilter } from './core/filters/exceptions.filter';
import { setupSwagger } from './config/swagger/config.swagger.app';
import { configStrings } from './config/app/config.string';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const hostCors = configService.get<string[]>('FRONT_HOST');
  const hostMethods = configService.get<string[]>('HOST_METHODS');
  const hostallowedHeaders = configService.get<string[]>(
    'HOST_ALLOWED_HEADERS',
  );
  const hostCredentials = configService.get<boolean>('HOST_CREDENTIALS');

  const apiPort = configService.get<number>('API_PORT');

  app.enableCors({
    origin: hostCors,
    credentials: hostCredentials,
    methods: hostMethods,
    allowedHeaders: hostallowedHeaders,
  });

  app.useGlobalFilters(new CustomExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
      },
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.setGlobalPrefix(configStrings().apiVersion, { exclude: ['estado'] });
  setupSwagger(app, configService);

  await app.listen(apiPort);
}
bootstrap();
