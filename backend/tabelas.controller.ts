import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

export interface TabelaDto {
  alias: string;
  descricao: string;
  imagem_url?: string | null;
  imagens?: string[];
}

@Controller('api/tabelas')
export class TabelasController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get()
  async findAll(@Query('q') q?: string) {
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      const result = await this.db.query(
        `SELECT * FROM protheus_tabelas
         WHERE alias ILIKE $1 OR descricao ILIKE $1
         ORDER BY alias ASC, id DESC`,
        [search],
      );
      return result.rows;
    }

    const result = await this.db.query(
      `SELECT * FROM protheus_tabelas ORDER BY alias ASC, id DESC`,
    );
    return result.rows;
  }

  @Post()
  async create(@Body() body: TabelaDto) {
    const alias = (body?.alias || '').trim().toUpperCase();
    const descricao = (body?.descricao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!alias || !descricao) {
      throw new HttpException(
        'Alias e Descrição são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `INSERT INTO protheus_tabelas (alias, descricao, imagem_url, imagens)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING *`,
      [alias, descricao, imagem_url, JSON.stringify(imagens)],
    );

    return result.rows[0];
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: TabelaDto) {
    const alias = (body?.alias || '').trim().toUpperCase();
    const descricao = (body?.descricao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!alias || !descricao) {
      throw new HttpException(
        'Alias e Descrição são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `UPDATE protheus_tabelas
       SET alias = $1, descricao = $2, imagem_url = $3, imagens = $4::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [alias, descricao, imagem_url, JSON.stringify(imagens), Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Tabela não encontrada.', HttpStatus.NOT_FOUND);
    }

    return result.rows[0];
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.db.query(
      `DELETE FROM protheus_tabelas WHERE id = $1 RETURNING id`,
      [Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Tabela não encontrada.', HttpStatus.NOT_FOUND);
    }

    return { deleted: true, id: Number(id) };
  }
}
