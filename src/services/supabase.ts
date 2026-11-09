import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

import { authStorage } from './secureStorage';

// Referência literal: o Expo só inlina EXPO_PUBLIC_* assim.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Config ausente: defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY (veja .env.example).',
  );
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodifica base64url para string (ASCII), sem libs. */
function decodeBase64Url(input: string): string {
  const clean = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let bits = 0;
  let acc = 0;
  let out = '';
  for (const ch of clean) {
    const idx = B64.indexOf(ch);
    if (idx < 0) throw new Error('base64 inválido');
    acc = (acc << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((acc >> bits) & 0xff);
    }
  }
  return out;
}

/** Recusa chaves administrativas: JWT com role service_role ou chave sb_secret_*. */
function assertNotServiceRole(key: string): void {
  if (key.startsWith('sb_secret_')) {
    throw new Error('Chave administrativa recusada: use apenas a chave anon.');
  }
  const parts = key.split('.');
  if (parts.length !== 3) return; // chave não-JWT (ex.: sb_publishable_*)
  let role: unknown;
  try {
    role = (JSON.parse(decodeBase64Url(parts[1])) as { role?: unknown }).role;
  } catch {
    return;
  }
  if (role === 'service_role') {
    throw new Error('Chave service_role recusada: use apenas a chave anon.');
  }
}

assertNotServiceRole(anonKey);

/** Único cliente Supabase do app. Só src/services/ importa este módulo. */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
