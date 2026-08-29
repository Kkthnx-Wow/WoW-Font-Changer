export type GameVersion =
  | "retail"
  | "ptr"
  | "beta"
  | "xptr"
  | "classic"
  | "classicPtr"
  | "classicBeta"
  | "classicTitan"
  | "anniversary"
  | "era"
  | "classicEraPtr"
  | "classicEraBeta";

export type FontMapping = "combat" | "chat" | "mail" | "quest" | "all";

export type LocalePack = "cyrillic" | "korean" | "chinese";

/** Exact WoW Fonts/ override names, case-sensitive and always `.ttf`. */
export const WOW_FONT_FILES = [
  "skurri.ttf",
  "ARIALN.ttf",
  "MORPHEUS.ttf",
  "FRIZQT__.ttf",
] as const;

export const LOCALE_PACK_FILES: Record<LocalePack, readonly string[]> = {
  cyrillic: [
    "skurri_CYR.ttf",
    "ARIALN_CYR.ttf",
    "MORPHEUS_CYR.ttf",
    "FRIZQT___CYR.ttf",
  ],
  korean: ["2002.ttf", "2002B.ttf", "K_Damage.ttf", "K_Pagetext.ttf"],
  chinese: [
    "ARHei.ttf",
    "ARKai_C.ttf",
    "ARKai_T.ttf",
    "bHEI00M.ttf",
    "bHEI01B.ttf",
    "bKAI00M.ttf",
    "bLEI00D.ttf",
    "arheiuhk_bd.ttf",
  ],
};

export const FONT_MAPPING_TARGETS: Record<
  FontMapping,
  { target: string; localeTargets?: Partial<Record<LocalePack, string>> }
> = {
  combat: {
    target: "skurri.ttf",
    localeTargets: { cyrillic: "skurri_CYR.ttf" },
  },
  chat: {
    target: "ARIALN.ttf",
    localeTargets: { cyrillic: "ARIALN_CYR.ttf" },
  },
  mail: {
    target: "MORPHEUS.ttf",
    localeTargets: { cyrillic: "MORPHEUS_CYR.ttf" },
  },
  quest: {
    target: "FRIZQT__.ttf",
    localeTargets: { cyrillic: "FRIZQT___CYR.ttf" },
  },
  all: { target: WOW_FONT_FILES.join(", ") },
};

export interface DetectResult {
  basePath: string | null;
  retail: string | null;
  ptr: string | null;
  beta: string | null;
  xptr: string | null;
  classic: string | null;
  classicPtr: string | null;
  classicBeta: string | null;
  classicTitan: string | null;
  anniversary: string | null;
  era: string | null;
  classicEraPtr: string | null;
  classicEraBeta: string | null;
}

export interface ApplyResult {
  applied: string[];
  backupDir: string;
  compressedBackup: string | null;
  slugCacheCleared: number;
}

export interface AppSettings {
  autoDetect: boolean;
  manualPath: string;
  fontMappings: FontMapping[];
  localePacks: LocalePack[];
  compressBackup: boolean;
}

export type GameVersionGroup = "retail" | "classic" | "classicEra";

export const GAME_VERSION_GROUPS: {
  id: GameVersionGroup;
  versions: GameVersion[];
}[] = [
  {
    id: "retail",
    versions: ["retail", "ptr", "beta", "xptr"],
  },
  {
    id: "classic",
    versions: ["classic", "classicPtr", "classicBeta", "classicTitan", "anniversary"],
  },
  {
    id: "classicEra",
    versions: ["era", "classicEraPtr", "classicEraBeta"],
  },
];

export const LOCALE_PACK_IDS: LocalePack[] = ["cyrillic", "korean", "chinese"];

export const FONT_MAPPING_IDS: FontMapping[] = [
  "combat",
  "chat",
  "mail",
  "quest",
  "all",
];

const FLAVOR_PATH_KEYS: Record<GameVersion, keyof DetectResult> = {
  retail: "retail",
  ptr: "ptr",
  beta: "beta",
  xptr: "xptr",
  classic: "classic",
  classicPtr: "classicPtr",
  classicBeta: "classicBeta",
  classicTitan: "classicTitan",
  anniversary: "anniversary",
  era: "era",
  classicEraPtr: "classicEraPtr",
  classicEraBeta: "classicEraBeta",
};

export function getFlavorPath(
  detection: DetectResult | null,
  version: GameVersion,
): string | null {
  if (!detection) return null;
  const key = FLAVOR_PATH_KEYS[version];
  const value = detection[key];
  return typeof value === "string" ? value : null;
}

export function isVersionAvailable(
  version: GameVersion,
  detection: DetectResult | null,
): boolean {
  if (!detection?.basePath) return false;
  return Boolean(getFlavorPath(detection, version));
}
