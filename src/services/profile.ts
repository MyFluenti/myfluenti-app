import type { ProfileSummary } from '@/types/contract';
import type { Database } from '@/types/database';
import { getDeviceTimezone } from '@/utils/timezone';

import { assertOk } from './errors';
import { rpc } from './rpc';
import { requireUserId } from './session';
import { supabase } from './supabase';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/** Só os campos liberados pelo grant de colunas do aluno. */
export type ProfilePatch = Pick<
  ProfileUpdate,
  'display_name' | 'locale' | 'self_assessed_level_id' | 'onboarding_completed_at'
>;

const ALLOWED: (keyof ProfilePatch)[] = [
  'display_name',
  'locale',
  'self_assessed_level_id',
  'onboarding_completed_at',
];

export function getProfileSummary(): Promise<ProfileSummary> {
  return rpc<ProfileSummary>('get_profile_summary', { p_timezone: getDeviceTimezone() });
}

export async function updateProfile(patch: ProfilePatch): Promise<void> {
  // Filtra em runtime também: um campo fora do grant derrubaria o update inteiro.
  const safe: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (patch[key] !== undefined) safe[key] = patch[key];
  }
  const userId = await requireUserId();
  assertOk(await supabase.from('profiles').update(safe as ProfilePatch).eq('id', userId));
}
