import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TabelasController } from './tabelas.controller';
import { ParametrosController } from './parametros.controller';
import { HelpsController } from './helps.controller';
import { OverviewController } from './overview.controller';

@Module({
  imports: [],
  controllers: [
    OverviewController,
    TabelasController,
    ParametrosController,
    HelpsController,
  ],
  providers: [DatabaseService],
})
export class AppModule {}

