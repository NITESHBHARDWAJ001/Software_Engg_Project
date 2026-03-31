import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specPath = path.resolve(__dirname, '../../docs/api/openapi.json');

export const getOpenApiSpec = () => {
  const raw = readFileSync(specPath, 'utf8');
  return JSON.parse(raw);
};
