import 'reflect-metadata';
import { createConfiguredExpressServer } from '../backend/bootstrap';

export default async function handler(req: any, res: any) {
  const server = await createConfiguredExpressServer();
  return server(req, res);
}
