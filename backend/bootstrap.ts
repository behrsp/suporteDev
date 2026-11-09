import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module';

let cachedServer: Express | null = null;

export async function createConfiguredExpressServer(): Promise<Express> {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp = express();
  expressApp.use(express.json({ limit: '15mb' }));
  expressApp.use(express.urlencoded({ limit: '15mb', extended: true }));

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      bodyParser: false,
      logger: ['error', 'warn', 'log'],
    },
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  await app.init();
  cachedServer = expressApp;
  return expressApp;
}
