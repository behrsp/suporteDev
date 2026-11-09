export type TipoParametro = 'Caractere' | 'Numero' | 'Logico' | 'Data';

export interface ProtheusTabela {
  id: number;
  alias: string;
  descricao: string;
  imagem_url?: string | null;
  imagens?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProtheusParametro {
  id: number;
  nome: string;
  tipo: TipoParametro;
  descricao: string;
  imagem_url?: string | null;
  imagens?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProtheusHelp {
  id: number;
  nome_help: string;
  descritivo: string;
  solucao: string;
  imagem_url?: string | null;
  imagens?: string[];
  created_at?: string;
  updated_at?: string;
}

export type ActiveTab = 'todos' | 'tabelas' | 'parametros' | 'helps';
export type FormCategory = 'tabelas' | 'parametros' | 'helps';

