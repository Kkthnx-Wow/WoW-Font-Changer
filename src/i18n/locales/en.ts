import type { Translation } from "../types";

export const en: Translation = {
  app: {
    title: "WoW Font Changer",
    subtitle: "Compact font widget",
  },
  header: { notInstalled: " (not installed)" },
  dropzone: {
    loadingPreview: "Loading font preview…",
    dragDrop: "Drag & Drop .ttf / .otf here",
    dragDropHint:
      "Preview updates instantly. .otf sources are saved as .ttf for WoW.",
    browseFont: "Browse Font File",
    loadedFont: "Loaded font",
    clear: "Clear",
  },
  preview: {
    title: "Live Preview",
    combatLabel: "Combat text",
    combatSample: "Critical Hit! 4,821",
    questLabel: "Quest & UI text",
    questSample: "Accept Quest",
    chatLabel: "Chat text",
    chatSample: "Ready!",
    chatPlayer: "Player",
  },
  footer: {
    working: "Working…",
    loading: "Loading…",
    applyFont: "Apply Font",
    restoreDefaults: "Restore Defaults",
  },
  settings: {
    title: "Settings",
    close: "Close settings",
    autoDetect: "Auto-Detect WoW",
    autoDetectHintWindows: "Scan registry, all drives & common paths",
    autoDetectHintMac: "Scan Applications, volumes & common paths",
    autoDetectHintLinux: "Scan Games folder, Wine prefixes & Lutris/Bottles",
    noPathSelected: "No path selected",
    browseWow: "Browse WoW Folder",
    activeTarget: "Active target",
    notDetected: "Not detected",
    fontTargets: "Font Targets",
    fontTargetsHint:
      "WoW requires exact file names (case-sensitive) with a .ttf extension, even if your source font is .otf. Apply also clears stale .slug and .slugo GPU cache files.",
    perSlotFonts: "Per-Slot Fonts",
    perSlotFontsHint:
      "Optional. Give a slot its own font. Slots left empty use the main font above.",
    perSlotUsesMain: "Uses main font",
    localePacks: "Locale Font Slots",
    localePacksHint:
      "Also write region-specific font files used by non-Latin WoW clients (Cyrillic, Korean, Chinese).",
    compressBackup: "Compress Backup",
    compressBackupHint: "Zip .backup folder after apply",
    language: "Language",
    languageHint: "App interface language",
    about: "About",
  },
  fontMappings: {
    combat: {
      label: "Combat Text",
      description: "Floating damage numbers",
    },
    chat: { label: "Chat", description: "Chat and small info text" },
    mail: {
      label: "Mail & Quest Headers",
      description: "Mail window and quest log titles",
    },
    quest: {
      label: "Quest & UI",
      description: "Quest dialogs, buttons, names",
    },
    all: {
      label: "Replace All",
      description: "All Latin WoW font slots",
    },
  },
  localePacks: {
    cyrillic: {
      label: "Cyrillic",
      description: "Russian & Eastern European clients",
    },
    korean: {
      label: "Korean",
      description: "Korean client font slots",
    },
    chinese: {
      label: "Chinese",
      description: "Simplified & Traditional Chinese slots",
    },
  },
  gameVersions: {
    retail: "Retail",
    ptr: "Retail PTR",
    beta: "Retail Beta",
    xptr: "Retail PTR 2",
    classic: "Classic",
    classicPtr: "Classic PTR",
    classicBeta: "Classic Beta",
    classicTitan: "Classic Titan",
    anniversary: "Anniversary",
    era: "Era",
    classicEraPtr: "Era PTR",
    classicEraBeta: "Era Beta",
  },
  gameGroups: {
    retail: "Retail",
    classic: "Classic",
    classicEra: "Classic Era",
  },
  dialogs: {
    applyTitle: "Apply Custom Font?",
    applyBody:
      "This will replace WoW font files in your Fonts folder. Originals are backed up first. Restart WoW after applying.",
    applyOk: "Apply",
    applyCancel: "Cancel",
    restoreTitle: "Restore Defaults?",
    restoreBody: "Restore original fonts from the .backup folder?",
    restoreOk: "Restore",
    restoreCancel: "Cancel",
    pickFontTitle: "Select Font File",
    pickWowTitle: "Select World of Warcraft Folder",
    fontFilter: "Font",
  },
  status: {
    pathUpdated: "WoW path updated.",
    applied: "Applied to {{count}} slots. Restart WoW to see changes.",
    appliedOne: "Applied to 1 slot. Restart WoW to see changes.",
    slugCleared: " Cleared {{count}} Slug cache files.",
    slugClearedOne: " Cleared 1 Slug cache file.",
    backupZip: " Backup zip: {{path}}",
    restored: "Restored {{count}} fonts from backup.",
    restoredOne: "Restored 1 font from backup.",
    nothingToRestore: "Nothing to restore.",
  },
  errors: {
    dropFontFirst: "Drop a font file first.",
    selectTarget: "Select at least one font target in Settings.",
    wowNotFound: "WoW installation not found. Set a path in Settings.",
    fontMustBeTtfOtf: "Font must be a .ttf or .otf file",
  },
};
