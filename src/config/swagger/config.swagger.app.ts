import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { join } from 'path';
import { Request, Response } from 'express';
import * as express from 'express';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
) => {
  const entorno = configService.get<string>('NODE_ENV');
  if (entorno === 'production') {
    const swaggerPath = join(__dirname, '..', 'node_modules/swagger-ui-dist');
    app.use('/swagger-ui', express.static(swaggerPath));
  } else {
    app.use('/swagger-ui', express.static('node_modules/swagger-ui-dist'));
  }

  const configSwagger = new DocumentBuilder()
    .setTitle('HelpdeskIT - Backend')
    .setDescription('Backend hecho con NestJS para crear tickets e incidencias')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      description:
        'Ingresar token Bearer para el inicio de sesión del proyecto',
      name: 'helpdeskit',
    })
    .build();

  if (entorno !== 'production') {
    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('/', app, document);
  } else {
    app.use('/', async (req: Request, res: Response) => {
      res.status(200).json({ mensaje: 'Bienvenido a la api de Helpdeskit' });
    });
  }
};
