export type GameVersion = "retail" | "classic" | "era";

export type FontMapping = "combat" | "chat" | "mail" | "quest" | "all";

/** Exact WoW Fonts/ override names — case-sensitive, always `.ttf`. */
export const WOW_FONT_FILES = [
  "skurri.ttf",
  "ARIALN.ttf",
  "MORPHEUS.ttf",
  "FRIZQT__.ttf",
] as const;

/** Cyrillic alphabet overrides — note FRIZQT___CYR.ttf uses three underscores. */
export const WOW_CYRILLIC_FONT_FILES = [
  "skurri_CYR.ttf",
  "ARIALN_CYR.ttf",
  "MORPHEUS_CYR.ttf",
  "FRIZQT___CYR.ttf",
] as const;

export interface DetectResult {
  basePath: string | null;
  retail: string | null;
  classic: string | null;
  era: string | null;
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
  includeCyrillic: boolean;
  compressBackup: boolean;
}

export const FONT_MAPPING_OPTIONS: {
  id: FontMapping;
  label: string;
  description: string;
  target: string;
  cyrTarget?: string;
}[] = [
  {
    id: "combat",
    label: "Combat Text",
    description: "Floating damage numbers",
    target: "skurri.ttf",
    cyrTarget: "skurri_CYR.ttf",
  },
  {
    id: "chat",
    label: "Chat",
    description: "Chat and small info text",
    target: "ARIALN.ttf",
    cyrTarget: "ARIALN_CYR.ttf",
  },
  {
    id: "mail",
    label: "Mail & Quest Headers",
    description: "Mail window and quest log titles",
    target: "MORPHEUS.ttf",
    cyrTarget: "MORPHEUS_CYR.ttf",
  },
  {
    id: "quest",
    label: "Quest & UI",
    description: "Quest dialogs, buttons, names",
    target: "FRIZQT__.ttf",
    cyrTarget: "FRIZQT___CYR.ttf",
  },
  {
    id: "all",
    label: "Replace All",
    description: "All Latin WoW font slots",
    target: WOW_FONT_FILES.join(", "),
  },
];

export const GAME_VERSION_LABELS: Record<GameVersion, string> = {
  retail: "Retail",
  classic: "Classic",
  era: "Era",
};
