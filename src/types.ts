export type GameVersion =
  | "retail"
  | "ptr"
  | "beta"
  | "xptr"
  | "forever"
  | "classic"
  | "classicPtr"
  | "classicBeta"
  | "classicTitan"
  | "anniversary"
  | "era"
  | "classicEraPtr"
  | "classicEraBeta";

export type FontMapping = "combat" | "chat" | "mail" | "quest" | "all";

/** The four Latin slots that can each take their own font in advanced mode. */
export type SlotMapping = "combat" | "chat" | "mail" | "quest";

export const SLOT_MAPPING_IDS: SlotMapping[] = ["combat", "chat", "mail", "quest"];

export type LocalePack = "cyrillic" | "korean" | "chinese";

/** One font paired with the slots it fills. The backend applies a list of these. */
export interface FontAssignment {
  fontPath: string;
  mappings: FontMapping[];
  localePacks: LocalePack[];
}

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

export const FONT_MAPPING_TARGETS: Record<FontMapping, string> = {
  combat: "skurri.ttf",
  chat: "ARIALN.ttf",
  mail: "MORPHEUS.ttf",
  quest: "FRIZQT__.ttf",
  all: WOW_FONT_FILES.join(", "),
};

/** Install base plus each flavor folder found in it, keyed by `GameVersion`. */
export interface DetectResult {
  basePath: string | null;
  flavors: Partial<Record<GameVersion, string>>;
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

export type GameVersionGroup = "retail" | "forever" | "classic" | "classicEra";

export const GAME_VERSION_GROUPS: {
  id: GameVersionGroup;
  versions: GameVersion[];
}[] = [
  {
    id: "retail",
    versions: ["retail", "ptr", "beta", "xptr"],
  },
  {
    id: "forever",
    versions: ["forever"],
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

export const GAME_VERSION_IDS: GameVersion[] = GAME_VERSION_GROUPS.flatMap(
  (group) => group.versions,
);

export function isGameVersion(value: unknown): value is GameVersion {
  return GAME_VERSION_IDS.includes(value as GameVersion);
}

export function getFlavorPath(
  detection: DetectResult | null,
  version: GameVersion,
): string | null {
  return detection?.flavors?.[version] ?? null;
}

export function isVersionAvailable(
  version: GameVersion,
  detection: DetectResult | null,
): boolean {
  return Boolean(detection?.basePath && getFlavorPath(detection, version));
}
