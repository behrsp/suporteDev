import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createConfiguredExpressServer } from './bootstrap';

dotenv.config();

async function startLocalServer() {
  const port = Number(process.env.PORT || 3001);
  const server = await createConfiguredExpressServer();
  server.listen(port, () => {
    console.log(`🚀 Suporte Protheus API (NestJS) rodando em http://localhost:${port}`);
  });
}

startLocalServer().catch((err) => {
  console.error('Erro ao iniciar servidor NestJS:', err);
  process.exit(1);
});

