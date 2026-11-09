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

export type TipoParametro = 'Caractere' | 'Numero' | 'Logico' | 'Data';

export interface ParametroDto {
  nome: string;
  tipo: TipoParametro;
  descricao: string;
  imagem_url?: string | null;
  imagens?: string[];
}

const VALID_TIPOS: TipoParametro[] = ['Caractere', 'Numero', 'Logico', 'Data'];

@Controller('api/parametros')
export class ParametrosController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get()
  async findAll(@Query('q') q?: string, @Query('tipo') tipo?: string) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(`(nome ILIKE $${params.length} OR descricao ILIKE $${params.length})`);
    }

    if (tipo && VALID_TIPOS.includes(tipo as TipoParametro)) {
      params.push(tipo);
      conditions.push(`tipo = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.db.query(
      `SELECT * FROM protheus_parametros ${whereClause} ORDER BY nome ASC, id DESC`,
      params,
    );
    return result.rows;
  }

  @Post()
  async create(@Body() body: ParametroDto) {
    const nome = (body?.nome || '').trim().toUpperCase();
    const tipo = (body?.tipo || 'Caractere').trim() as TipoParametro;
    const descricao = (body?.descricao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!nome || !descricao) {
      throw new HttpException(
        'Nome e Descrição do parâmetro são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!VALID_TIPOS.includes(tipo)) {
      throw new HttpException(
        'Tipo inválido. Escolha entre Caractere, Numero, Logico ou Data.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `INSERT INTO protheus_parametros (nome, tipo, descricao, imagem_url, imagens)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [nome, tipo, descricao, imagem_url, JSON.stringify(imagens)],
    );

    return result.rows[0];
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: ParametroDto) {
    const nome = (body?.nome || '').trim().toUpperCase();
    const tipo = (body?.tipo || 'Caractere').trim() as TipoParametro;
    const descricao = (body?.descricao || '').trim();
    const imagens = Array.isArray(body?.imagens)
      ? body.imagens
      : body?.imagem_url
      ? [body.imagem_url]
      : [];
    const imagem_url = body?.imagem_url ?? (imagens.length > 0 ? imagens[0] : null);

    if (!nome || !descricao) {
      throw new HttpException(
        'Nome e Descrição do parâmetro são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!VALID_TIPOS.includes(tipo)) {
      throw new HttpException(
        'Tipo inválido. Escolha entre Caractere, Numero, Logico ou Data.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.db.query(
      `UPDATE protheus_parametros
       SET nome = $1, tipo = $2, descricao = $3, imagem_url = $4, imagens = $5::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome, tipo, descricao, imagem_url, JSON.stringify(imagens), Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Parâmetro não encontrado.', HttpStatus.NOT_FOUND);
    }

    return result.rows[0];
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.db.query(
      `DELETE FROM protheus_parametros WHERE id = $1 RETURNING id`,
      [Number(id)],
    );

    if (result.rowCount === 0) {
      throw new HttpException('Parâmetro não encontrado.', HttpStatus.NOT_FOUND);
    }

    return { deleted: true, id: Number(id) };
  }
}
