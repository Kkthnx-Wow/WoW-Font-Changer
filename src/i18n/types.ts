import type { GameVersion } from "../types";

export type AppLocale =
  | "en"
  | "de"
  | "es"
  | "fr"
  | "it"
  | "pt-BR"
  | "ru"
  | "ko"
  | "zh-CN"
  | "zh-TW";

export const APP_LOCALES: { id: AppLocale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "de", label: "Deutsch" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "it", label: "Italiano" },
  { id: "pt-BR", label: "Português (BR)" },
  { id: "ru", label: "Русский" },
  { id: "ko", label: "한국어" },
  { id: "zh-CN", label: "简体中文" },
  { id: "zh-TW", label: "繁體中文" },
];

export interface Translation {
  app: {
    title: string;
  };
  header: {
    notInstalled: string;
    openSettings: string;
    gameVersion: string;
  };
  dropzone: {
    loadingPreview: string;
    dragDrop: string;
    dragDropHint: string;
    browseFont: string;
    clear: string;
    change: string;
    dropOverlay: string;
  };
  slots: {
    title: string;
    ownFont: string;
    useMain: string;
    notChanged: string;
    needsFont: string;
  };
  preview: {
    combatSample: string;
    mailSample: string;
    questSample: string;
    chatSample: string;
    chatPlayer: string;
  };
  footer: {
    working: string;
    loading: string;
    applyFont: string;
    applyCount: string;
    applyOne: string;
    restoreDefaults: string;
  };
  settings: {
    title: string;
    close: string;
    autoDetect: string;
    autoDetectHintWindows: string;
    autoDetectHintMac: string;
    autoDetectHintLinux: string;
    noPathSelected: string;
    browseWow: string;
    activeTarget: string;
    notDetected: string;
    localePacks: string;
    localePacksHint: string;
    compressBackup: string;
    compressBackupHint: string;
    language: string;
    languageHint: string;
    about: string;
  };
  fontMappings: {
    combat: { label: string; description: string };
    chat: { label: string; description: string };
    mail: { label: string; description: string };
    quest: { label: string; description: string };
  };
  localePacks: {
    cyrillic: { label: string; description: string };
    korean: { label: string; description: string };
    chinese: { label: string; description: string };
  };
  gameVersions: Record<GameVersion, string>;
  gameGroups: {
    retail: string;
    forever: string;
    classic: string;
    classicEra: string;
  };
  dialogs: {
    applyTitle: string;
    applyBody: string;
    applyOk: string;
    applyCancel: string;
    restoreTitle: string;
    restoreBody: string;
    restoreOk: string;
    restoreCancel: string;
    pickFontTitle: string;
    pickWowTitle: string;
    fontFilter: string;
  };
  status: {
    pathUpdated: string;
    applied: string;
    appliedOne: string;
    slugCleared: string;
    slugClearedOne: string;
    backupZip: string;
    restored: string;
    restoredOne: string;
    nothingToRestore: string;
  };
  errors: {
    dropFontFirst: string;
    selectTarget: string;
    wowNotFound: string;
    fontMustBeTtfOtf: string;
  };
}

export type TranslationKey = keyof Translation;
