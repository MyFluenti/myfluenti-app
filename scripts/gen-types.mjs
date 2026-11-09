// Gera src/types/database.ts a partir do Supabase local (myfluenti-backend).
// Portável entre Windows e Linux: evita redirect de shell.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backend = resolve(root, '..', 'myfluenti-backend');
const out = resolve(root, 'src', 'types', 'database.ts');

const result = spawnSync(
  'npx -y supabase@2.121.0 gen types typescript --local',
  { cwd: backend, encoding: 'utf8', shell: true },
);

if (result.status !== 0 || !result.stdout) {
  console.error(result.stderr || 'gen types falhou');
  process.exit(result.status ?? 1);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, result.stdout);
console.log(`Tipos gravados em ${out}`);
