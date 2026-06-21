import type { AppSettings, GameVersion } from "../types";

const STORAGE_KEY = "wow-font-changer-settings-v2";

export interface PersistedSettings {
  gameVersion: GameVersion;
  settings: AppSettings;
}

export function loadPersistedSettings(): Partial<PersistedSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSettings;
  } catch {
    return null;
  }
}

export function savePersistedSettings(data: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or private mode — non-fatal
  }
}
