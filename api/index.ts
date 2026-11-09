import 'reflect-metadata';
import { DatabaseService } from '../backend/database.service';
import { OverviewController } from '../backend/overview.controller';
import { TabelasController } from '../backend/tabelas.controller';
import { ParametrosController } from '../backend/parametros.controller';
import { HelpsController } from '../backend/helps.controller';

const dbService = new DatabaseService();
const overviewController = new OverviewController(dbService);
const tabelasController = new TabelasController(dbService);
const parametrosController = new ParametrosController(dbService);
const helpsController = new HelpsController(dbService);

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const host = req.headers?.host || 'localhost';
    const fullUrl = new URL(req.url || '/api', `http://${host}`);

    // Support both direct /api/... URLs and Vercel rewritten ?__path=...
    const rewrittenPath = fullUrl.searchParams.get('__path');
    const rawPathname = rewrittenPath
      ? `/api/${rewrittenPath.replace(/^\/+/, '')}`
      : fullUrl.pathname;

    const cleanPath = rawPathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
    const segments = cleanPath ? cleanPath.split('/') : [];
    const resource = segments[0] || 'overview';
    const resourceId = segments[1] || '';

    const q = fullUrl.searchParams.get('q') || undefined;
    const tipo = fullUrl.searchParams.get('tipo') || undefined;
    const method = (req.method || 'GET').toUpperCase();

    let result: any;

    if (resource === 'health' && method === 'GET') {
      result = await overviewController.health();
    } else if (resource === 'overview' && method === 'GET') {
      result = await overviewController.getOverview(q);
    } else if (resource === 'tabelas') {
      if (method === 'GET') {
        result = await tabelasController.findAll(q);
      } else if (method === 'POST') {
        const body = await parseJsonBody(req);
        result = await tabelasController.create(body);
      } else if (method === 'PUT' && resourceId) {
        const body = await parseJsonBody(req);
        result = await tabelasController.update(resourceId, body);
      } else if (method === 'DELETE' && resourceId) {
        result = await tabelasController.remove(resourceId);
      } else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify({ message: 'Método não permitido.' }));
      }
    } else if (resource === 'parametros') {
      if (method === 'GET') {
        result = await parametrosController.findAll(q, tipo);
      } else if (method === 'POST') {
        const body = await parseJsonBody(req);
        result = await parametrosController.create(body);
      } else if (method === 'PUT' && resourceId) {
        const body = await parseJsonBody(req);
        result = await parametrosController.update(resourceId, body);
      } else if (method === 'DELETE' && resourceId) {
        result = await parametrosController.remove(resourceId);
      } else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify({ message: 'Método não permitido.' }));
      }
    } else if (resource === 'helps') {
      if (method === 'GET') {
        result = await helpsController.findAll(q);
      } else if (method === 'POST') {
        const body = await parseJsonBody(req);
        result = await helpsController.create(body);
      } else if (method === 'PUT' && resourceId) {
        const body = await parseJsonBody(req);
        result = await helpsController.update(resourceId, body);
      } else if (method === 'DELETE' && resourceId) {
        result = await helpsController.remove(resourceId);
      } else {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify({ message: 'Método não permitido.' }));
      }
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ message: `Rota não encontrada: /api/${cleanPath}` }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('Erro na API Suporte Protheus:', err);
    const status = typeof err?.getStatus === 'function' ? err.getStatus() : 500;
    const message = err?.message || 'Erro interno no servidor.';
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ message, statusCode: status }));
  }
}
