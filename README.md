# Suporte Protheus 🛠️

Base de Conhecimento rápida e responsiva (Mobile e Desktop) para consultas e cadastros de **Tabelas Protheus**, **Parâmetros (SX6)** e **Helps & Soluções** com suporte a **upload de imagens pelo dispositivo**.

## 🚀 Tecnologias
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (Modo Dark Azul)
- **Backend:** NestJS + Express + PostgreSQL (`pg`)
- **Banco de Dados:** Neon Serverless PostgreSQL
- **Deploy:** Pronto para Vercel (Frontend + Serverless NestJS API em `/api`)

## 📦 Estrutura de Cadastros
1. **Tabela Protheus** (`protheus_tabelas`)
   - `Alias`
   - `Descrição`
2. **Parâmetros** (`protheus_parametros`)
   - `Nome`
   - `Tipo` (`Caractere`, `Numero`, `Logico`, `Data`)
   - `Descrição`
3. **Helps** (`protheus_helps`)
   - `Nome Help`
   - `Descritivo`
   - `Solução`
   - `Upload de Imagem` (Dispositivo, Câmera Mobile ou `Ctrl+V`)

## 💻 Como executar localmente

```bash
npm install
npm run dev
```

- **Frontend (React/Vite):** `http://localhost:5173`
- **Backend (NestJS API):** `http://localhost:3001/api/overview`

