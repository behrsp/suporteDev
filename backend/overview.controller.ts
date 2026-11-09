import { Controller, Get, Query, Inject } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('api')
export class OverviewController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get('health')
  async health() {
    await this.db.query('SELECT 1');
    return { status: 'ok', app: 'Suporte Protheus API' };
  }

  @Get('overview')
  async getOverview(@Query('q') q?: string) {
    const search = q && q.trim() ? `%${q.trim()}%` : null;

    if (search) {
      const [tabelas, parametros, helps] = await Promise.all([
        this.db.query(
          `SELECT * FROM protheus_tabelas WHERE alias ILIKE $1 OR descricao ILIKE $1 ORDER BY alias ASC`,
          [search],
        ),
        this.db.query(
          `SELECT * FROM protheus_parametros WHERE nome ILIKE $1 OR descricao ILIKE $1 OR tipo ILIKE $1 ORDER BY nome ASC`,
          [search],
        ),
        this.db.query(
          `SELECT * FROM protheus_helps WHERE nome_help ILIKE $1 OR descritivo ILIKE $1 OR solucao ILIKE $1 ORDER BY id DESC`,
          [search],
        ),
      ]);

      return {
        tabelas: tabelas.rows,
        parametros: parametros.rows,
        helps: helps.rows,
        counts: {
          tabelas: tabelas.rows.length,
          parametros: parametros.rows.length,
          helps: helps.rows.length,
        },
      };
    }

    const [tabelas, parametros, helps] = await Promise.all([
      this.db.query(`SELECT * FROM protheus_tabelas ORDER BY alias ASC, id DESC`),
      this.db.query(`SELECT * FROM protheus_parametros ORDER BY nome ASC, id DESC`),
      this.db.query(`SELECT * FROM protheus_helps ORDER BY id DESC`),
    ]);

    return {
      tabelas: tabelas.rows,
      parametros: parametros.rows,
      helps: helps.rows,
      counts: {
        tabelas: tabelas.rows.length,
        parametros: parametros.rows.length,
        helps: helps.rows.length,
      },
    };
  }
}

