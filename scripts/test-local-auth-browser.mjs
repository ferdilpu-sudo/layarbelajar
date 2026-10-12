import { spawnSync } from 'node:child_process';
import { localSupabaseEnv } from './local-supabase-env.mjs';

const { url, anonKey } = localSupabaseEnv();
const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', '--config', 'playwright.auth.config.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Only the public anonymous key reaches Vite. Service key remains server-side.
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: anonKey,
    },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
