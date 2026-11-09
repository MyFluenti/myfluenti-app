import { getCalendars } from 'expo-localization';

export const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

/** Fuso IANA do aparelho (ex.: America/Sao_Paulo). O backend exige esse formato. */
export function getDeviceTimezone(): string {
  try {
    return getCalendars()[0]?.timeZone ?? FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}
