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

export interface HelpDto {
  nome_help: string;
  descritivo: string;
  solucao: string;
  imagem_url?: string | null;
  imagens?: string[];
}

@Controller('api/helps')
export class HelpsController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get()
  async findAll(@Query('q') q?: string) {
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      const result = await this.db.query(
        `SELECT * FROM protheus_helps
         WHERE nome_help ILIKE $1 OR descritivo ILIKE $1 OR solucao ILIKE $1
         ORDER BY id DESC`,
        [search],
      );
      return result.rows;
    }

    const result = await this.db.query(
      `SELECT * FROM protheus_helps ORDER BY id DESC`,
    );
    return result.rows;
  }

  @Post()
  async create(@Body() body: HelpDto) {
    const nome_help = (body?.nome_help || '').trim();
    const descritivo = (body?.descritivo || '').trim();
    const solucao = (body?.solucao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!nome_help || !descritivo || !solucao) {
      throw new HttpException(
        'Nome do Help, Descritivo e Solução são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `INSERT INTO protheus_helps (nome_help, descritivo, solucao, imagem_url, imagens)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [nome_help, descritivo, solucao, imagem_url, JSON.stringify(imagens)],
    );

    return result.rows[0];
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: HelpDto) {
    const nome_help = (body?.nome_help || '').trim();
    const descritivo = (body?.descritivo || '').trim();
    const solucao = (body?.solucao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!nome_help || !descritivo || !solucao) {
      throw new HttpException(
        'Nome do Help, Descritivo e Solução são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `UPDATE protheus_helps
       SET nome_help = $1, descritivo = $2, solucao = $3, imagem_url = $4, imagens = $5::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome_help, descritivo, solucao, imagem_url, JSON.stringify(imagens), Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Help não encontrado.', HttpStatus.NOT_FOUND);
    }

    return result.rows[0];
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.db.query(
      `DELETE FROM protheus_helps WHERE id = $1 RETURNING id`,
      [Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Help não encontrado.', HttpStatus.NOT_FOUND);
    }

    return { deleted: true, id: Number(id) };
  }
}

