import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const yamlSpecPath = path.resolve(__dirname, '../../docs/api/swagger.yml');
const jsonSpecPath = path.resolve(__dirname, '../../docs/api/openapi.json');

const readSpecFile = () => {
  try {
    return readFileSync(yamlSpecPath, 'utf8');
  } catch {
    // Backward-compatible fallback when YAML is not present.
    return readFileSync(jsonSpecPath, 'utf8');
  }
};

export const getOpenApiSpecRaw = () => readSpecFile();

export const getOpenApiSpec = () => {
  const raw = readSpecFile();
  return YAML.parse(raw);
};
