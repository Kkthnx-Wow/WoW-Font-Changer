import type { AppLocale } from "../i18n/types";
import type { AppSettings, GameVersion, LocalePack } from "../types";
import { FONT_MAPPING_IDS, LOCALE_PACK_IDS } from "../types";

const STORAGE_KEY = "wow-font-changer-settings-v3";
const LEGACY_STORAGE_KEY = "wow-font-changer-settings-v2";

export interface PersistedSettings {
  locale?: AppLocale;
  gameVersion: GameVersion;
  settings: AppSettings;
}

interface LegacySettingsV2 {
  autoDetect?: boolean;
  manualPath?: string;
  fontMappings?: AppSettings["fontMappings"];
  includeCyrillic?: boolean;
  localePacks?: LocalePack[];
  compressBackup?: boolean;
}

const defaultSettings: AppSettings = {
  autoDetect: true,
  manualPath: "",
  fontMappings: ["all"],
  localePacks: [],
  compressBackup: false,
};

function migrateSettings(raw: LegacySettingsV2): AppSettings {
  const localePacks = (
    raw.localePacks ??
    (raw.includeCyrillic ? (["cyrillic"] as LocalePack[]) : [])
  ).filter((pack): pack is LocalePack => LOCALE_PACK_IDS.includes(pack));

  const fontMappings = (raw.fontMappings ?? ["all"]).filter((mapping) =>
    FONT_MAPPING_IDS.includes(mapping),
  );

  return {
    autoDetect: raw.autoDetect ?? defaultSettings.autoDetect,
    manualPath: raw.manualPath ?? defaultSettings.manualPath,
    fontMappings:
      fontMappings.length > 0 ? fontMappings : defaultSettings.fontMappings,
    localePacks,
    compressBackup: raw.compressBackup ?? defaultSettings.compressBackup,
  };
}

export function loadPersistedSettings(): Partial<PersistedSettings> | null {
  try {
    const rawV3 = localStorage.getItem(STORAGE_KEY);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as Partial<PersistedSettings>;
      return {
        ...parsed,
        settings: migrateSettings(parsed.settings ?? {}),
      };
    }

    const rawV2 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawV2) return null;

    const parsed = JSON.parse(rawV2) as {
      gameVersion?: GameVersion;
      settings?: LegacySettingsV2;
      locale?: AppLocale;
    };

    return {
      locale: parsed.locale,
      gameVersion: parsed.gameVersion,
      settings: migrateSettings(parsed.settings ?? {}),
    };
  } catch {
    return null;
  }
}

export function savePersistedSettings(data: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Quota or private mode — non-fatal
  }
}
