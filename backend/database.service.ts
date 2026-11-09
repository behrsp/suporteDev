import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_FufWO8Dp6xwi@ep-royal-union-b6y2ioze-pooler.c-2.sa-east-1.aws.neon.tech/neondb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    const rawUrl = (process.env.DATABASE_URL || DEFAULT_NEON_URL)
      .trim()
      .replace(/^["']|["']$/g, '');
    // Remove query parameters that conflict with explicit pg ssl config
    const cleanUrl = rawUrl.split('?')[0];

    this.pool = new Pool({
      connectionString: cleanUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }

  async onModuleInit() {
    await this.ensureInitialized();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initSchema();
    try {
      await this.initPromise;
      this.initialized = true;
    } finally {
      this.initPromise = null;
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    await this.ensureInitialized();
    return this.pool.query<T>(text, params);
  }

  private async initSchema(): Promise<void> {
    this.logger.log('Conectando ao Neon PostgreSQL e verificando tabelas do Suporte Protheus...');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS protheus_tabelas (
        id SERIAL PRIMARY KEY,
        alias VARCHAR(20) NOT NULL,
        descricao TEXT NOT NULL,
        imagem_url TEXT,
        imagens JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS protheus_parametros (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('Caractere', 'Numero', 'Logico', 'Data')),
        descricao TEXT NOT NULL,
        imagem_url TEXT,
        imagens JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS protheus_helps (
        id SERIAL PRIMARY KEY,
        nome_help VARCHAR(150) NOT NULL,
        descritivo TEXT NOT NULL,
        solucao TEXT NOT NULL,
        imagem_url TEXT,
        imagens JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const tabelasCount = await this.pool.query('SELECT COUNT(*)::int AS count FROM protheus_tabelas');
    if (tabelasCount.rows[0].count === 0) {
      await this.pool.query(`
        INSERT INTO protheus_tabelas (alias, descricao) VALUES
        ('SA1', 'Cadastro de Clientes - Armazena dados cadastrais, fiscais e financeiros dos clientes (Faturamento / Financeiro).'),
        ('SA2', 'Cadastro de Fornecedores - Dados cadastrais, bancários e fiscais de fornecedores (Compras / Fiscal / Financeiro).'),
        ('SB1', 'Descrição Genérica do Produto - Cadastro principal de produtos, unidades de medida, NCM, grupo e regras de estoque.'),
        ('SC5', 'Cabeçalho do Pedido de Venda - Informações gerais do pedido de venda, cliente, condição de pagamento e transporte.'),
        ('SC6', 'Itens do Pedido de Venda - Produtos, quantidades, preços, TES e entregas vinculados ao cabeçalho SC5.'),
        ('SE1', 'Contas a Receber - Títulos financeiros a receber, parcelas, vencimentos, baixas e saldos.'),
        ('SE2', 'Contas a Pagar - Títulos financeiros a pagar, impostos retidos, vencimentos e borderôs.'),
        ('SF1', 'Cabeçalho das Notas Fiscais de Entrada - Dados fiscais e financeiros de documentos de entrada.'),
        ('SF2', 'Cabeçalho das Notas Fiscais de Saída - Dados de faturamento, impostos e chaves de NF-e de saída.'),
        ('SF4', 'Tipos de Entrada e Saída (TES) - Regras de cálculo de impostos (ICMS, IPI, PIS, COFINS), estoque e financeiro.');
      `);
    }

    const parametrosCount = await this.pool.query('SELECT COUNT(*)::int AS count FROM protheus_parametros');
    if (parametrosCount.rows[0].count === 0) {
      await this.pool.query(`
        INSERT INTO protheus_parametros (nome, tipo, descricao) VALUES
        ('MV_ESTADO', 'Caractere', 'Sigla da Unidade Federativa (UF) da empresa/filial corrente para cálculo de alíquotas de ICMS interno e interestadual.'),
        ('MV_ULMES', 'Data', 'Data do último fechamento de estoque (Virada de Saldos MATA280). Não permite movimentações de estoque com data anterior ou igual.'),
        ('MV_DATAFIN', 'Data', 'Data limite para realização de movimentações no módulo Financeiro (SIGAFIN). Bloqueia baixas e inclusões anteriores a esta data.'),
        ('MV_1DUP', 'Caractere', 'Define a sequência inicial da parcela na geração de duplicatas (ex: 1, A). Deve estar alinhado ao tamanho do campo E1_PARCELA.'),
        ('MV_FRETISS', 'Logico', 'Indica se o valor do frete compõe a base de cálculo do ISS nas operações de prestação de serviço (.T. ou .F.).'),
        ('MV_NUMITEN', 'Numero', 'Número máximo de itens permitidos na digitação de um Pedido de Venda (MATA410).');
      `);
    }

    const helpsCount = await this.pool.query('SELECT COUNT(*)::int AS count FROM protheus_helps');
    if (helpsCount.rows[0].count === 0) {
      await this.pool.query(`
        INSERT INTO protheus_helps (nome_help, descritivo, solucao) VALUES
        (
          'B1_COD / A010TOK',
          'Ao tentar salvar ou alterar um produto no MATA010, o sistema apresenta bloqueio informando que o grupo tributário ou NCM é obrigatório.',
          '1. Verifique na aba Fiscal do Cadastro de Produtos (SB1) se o campo B1_POSIPI (NCM) está preenchido e válido na tabela SYD.\n2. Confira se há validação customizada no Ponto de Entrada ITEM (MVC) ou A010TOK exigindo campos específicos da operação.'
        ),
        (
          'MA410COR / Bloqueio de Regra',
          'Pedido de venda fica com legenda laranja/azul ou não aparece disponível para liberação e faturamento no MATA450 / MATA460.',
          '1. Acesse a rotina Liberação de Pedidos (MATA440) ou Análise de Crédito/Estoque (MATA450/MATA455).\n2. Verifique o campo C9_BLCRED (Bloqueio de Crédito) e C9_BLEST (Bloqueio de Estoque) na tabela SC9.\n3. Caso esteja com código 01 ou 02, realize a liberação manual de crédito/estoque e refaça a avaliação.'
        ),
        (
          'MV_ULMES / ESTOQUE FECHADO',
          'Ao incluir Documento de Entrada (MATA103) ou Movimentação Interna (MATA241), exibe mensagem impedindo lançamento por data inferior ao fechamento.',
          '1. Consulte o parâmetro MV_ULMES no Configurador (SIGACFG) para a filial posicionada.\n2. Certifique-se de que a database do sistema (dDataBase) e a data de emissão/digitação são superiores à data gravada no parâmetro MV_ULMES.'
        );
      `);
    }

    this.logger.log('Banco de dados Neon PostgreSQL inicializado com sucesso!');
  }
}
