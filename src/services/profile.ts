import type { ProfileSummary } from '@/types/contract';
import type { Database } from '@/types/database';
import { getDeviceTimezone } from '@/utils/timezone';

import { AppError, assertOk } from './errors';
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

export type OnboardingState = {
  onboarding_completed_at: string | null;
  self_assessed_level_id: string | null;
  current_level_id: string | null;
};

/** Campos do próprio perfil que decidem a porta de entrada (autoavaliação e nivelamento). */
export async function getOnboardingState(): Promise<OnboardingState> {
  const userId = await requireUserId();
  const result = await supabase
    .from('profiles')
    .select('onboarding_completed_at, self_assessed_level_id, current_level_id')
    .eq('id', userId)
    .maybeSingle();
  assertOk(result);
  if (!result.data) throw new AppError({ kind: 'known', code: 'profile_not_found' });
  return result.data;
}
