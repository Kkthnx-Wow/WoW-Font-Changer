import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ask, open } from "@tauri-apps/plugin-dialog";
import {
  APP_LOCALES,
  detectBrowserLocale,
  I18nProvider,
  useI18n,
} from "../i18n";
import type { AppLocale } from "../i18n/types";
import {
  applyCustomFonts,
  clearPreviewFont,
  detectWowPath,
  loadPreviewFont,
  restoreDefaults,
  validateWowPath,
} from "../lib/tauri";
import {
  loadPersistedSettings,
  savePersistedSettings,
} from "../lib/settingsStorage";
import type {
  AppSettings,
  DetectResult,
  FontAssignment,
  FontMapping,
  GameVersion,
  LocalePack,
  SlotMapping,
} from "../types";
import {
  GAME_VERSION_GROUPS,
  isVersionAvailable,
  SLOT_MAPPING_IDS,
} from "../types";

/** A picked font file plus the family name its preview face loaded under. */
export interface LoadedFont {
  path: string;
  name: string;
  family: string;
}

type SlotFontMap = Record<SlotMapping, LoadedFont | null>;

const EMPTY_SLOT_FONTS: SlotFontMap = {
  combat: null,
  chat: null,
  mail: null,
  quest: null,
};

interface AppContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  gameVersion: GameVersion;
  setGameVersion: (v: GameVersion) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  selectedSlots: SlotMapping[];
  toggleSlot: (slot: SlotMapping) => void;
  toggleLocalePack: (pack: LocalePack) => void;
  wowDetection: DetectResult | null;
  activeWowPath: string | null;
  mainFont: LoadedFont | null;
  isLoadingFont: boolean;
  setFontFromPath: (path: string) => Promise<void>;
  pickFontFile: () => Promise<void>;
  clearFont: () => void;
  slotFonts: SlotFontMap;
  setSlotFont: (slot: SlotMapping) => Promise<void>;
  clearSlotFont: (slot: SlotMapping) => void;
  /** Latin slots that Apply would write right now. */
  applyCount: number;
  canApply: boolean;
  pickManualPath: () => Promise<void>;
  applyFont: () => Promise<void>;
  restoreDefaultFonts: () => Promise<void>;
  status: string | null;
  error: string | null;
  isBusy: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const defaultSettings: AppSettings = {
  autoDetect: true,
  manualPath: "",
  fontMappings: ["all"],
  localePacks: [],
  compressBackup: false,
};

const FONT_EXTENSIONS = ["ttf", "otf"];

function pathBasename(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function selectedSlotsOf(mappings: FontMapping[]): SlotMapping[] {
  return mappings.includes("all")
    ? SLOT_MAPPING_IDS
    : SLOT_MAPPING_IDS.filter((slot) => mappings.includes(slot));
}

function resolveActivePath(
  detection: DetectResult | null,
  settings: AppSettings,
): string | null {
  if (!settings.autoDetect && settings.manualPath) {
    return settings.manualPath;
  }
  return detection?.basePath ?? null;
}

function firstAvailableVersion(detection: DetectResult | null): GameVersion {
  for (const group of GAME_VERSION_GROUPS) {
    for (const version of group.versions) {
      if (isVersionAvailable(version, detection)) return version;
    }
  }
  return "retail";
}

function loadInitialState() {
  const persisted = loadPersistedSettings();
  const storedLocale = persisted?.locale;
  return {
    locale:
      storedLocale && APP_LOCALES.some((l) => l.id === storedLocale)
        ? storedLocale
        : detectBrowserLocale(),
    gameVersion: persisted?.gameVersion ?? ("retail" as GameVersion),
    settings: { ...defaultSettings, ...persisted?.settings },
  };
}

function AppProviderInner({
  children,
  locale,
  setLocale,
  initial,
}: {
  children: ReactNode;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  initial: ReturnType<typeof loadInitialState>;
}) {
  const { t, format } = useI18n();
  const [gameVersion, setGameVersion] = useState<GameVersion>(initial.gameVersion);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);
  const [wowDetection, setWowDetection] = useState<DetectResult | null>(null);
  const [mainFont, setMainFont] = useState<LoadedFont | null>(null);
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [slotFonts, setSlotFonts] = useState<SlotFontMap>(EMPTY_SLOT_FONTS);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const activeWowPath = useMemo(
    () => resolveActivePath(wowDetection, settings),
    [wowDetection, settings],
  );

  const selectedSlots = useMemo(
    () => selectedSlotsOf(settings.fontMappings),
    [settings.fontMappings],
  );

  useEffect(() => {
    savePersistedSettings({ locale, gameVersion, settings });
  }, [locale, gameVersion, settings]);

  useEffect(() => {
    // Ignore a slow result that lands after the user already changed the
    // path source, otherwise it would overwrite the newer detection.
    let cancelled = false;
    const useManual = !settings.autoDetect && Boolean(settings.manualPath);
    const run = useManual ? validateWowPath(settings.manualPath) : detectWowPath();
    run.then(
      (result) => {
        if (!cancelled) setWowDetection(result);
      },
      (err: unknown) => {
        if (cancelled) return;
        setWowDetection(null);
        // A saved manual folder that moved or was deleted should say so,
        // not leave the target list silently empty.
        if (useManual) setError(errorText(err));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [settings.autoDetect, settings.manualPath]);

  useEffect(() => {
    if (!wowDetection) return;
    if (!isVersionAvailable(gameVersion, wowDetection)) {
      setGameVersion(firstAvailableVersion(wowDetection));
    }
  }, [wowDetection, gameVersion]);

  useEffect(() => () => clearPreviewFont(), []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleSlot = useCallback((slot: SlotMapping) => {
    setSettings((prev) => {
      const current = selectedSlotsOf(prev.fontMappings);
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : SLOT_MAPPING_IDS.filter((s) => s === slot || current.includes(s));
      // "all" keeps older saved settings and the backend shortcut working.
      const fontMappings: FontMapping[] =
        next.length === SLOT_MAPPING_IDS.length ? ["all"] : next;
      return { ...prev, fontMappings };
    });
  }, []);

  const selectSlot = useCallback((slot: SlotMapping) => {
    setSettings((prev) => {
      const current = selectedSlotsOf(prev.fontMappings);
      if (current.includes(slot)) return prev;
      const next = SLOT_MAPPING_IDS.filter((s) => s === slot || current.includes(s));
      const fontMappings: FontMapping[] =
        next.length === SLOT_MAPPING_IDS.length ? ["all"] : next;
      return { ...prev, fontMappings };
    });
  }, []);

  const toggleLocalePack = useCallback((pack: LocalePack) => {
    setSettings((prev) => {
      const next = prev.localePacks.includes(pack)
        ? prev.localePacks.filter((p) => p !== pack)
        : [...prev.localePacks, pack];
      return { ...prev, localePacks: next };
    });
  }, []);

  const pickFont = useCallback(async (): Promise<string | null> => {
    const selected = await open({
      multiple: false,
      title: t.dialogs.pickFontTitle,
      filters: [{ name: t.dialogs.fontFilter, extensions: FONT_EXTENSIONS }],
    });
    return typeof selected === "string" ? selected : null;
  }, [t]);

  const setFontFromPath = useCallback(async (path: string) => {
    setError(null);
    setStatus(null);
    setIsLoadingFont(true);
    try {
      const family = await loadPreviewFont(path, "main");
      setMainFont({ path, name: pathBasename(path), family });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsLoadingFont(false);
    }
  }, []);

  const pickFontFile = useCallback(async () => {
    const path = await pickFont();
    if (path) await setFontFromPath(path);
  }, [pickFont, setFontFromPath]);

  const clearFont = useCallback(() => {
    clearPreviewFont("main");
    setMainFont(null);
  }, []);

  const setSlotFont = useCallback(
    async (slot: SlotMapping) => {
      const path = await pickFont();
      if (!path) return;
      setError(null);
      try {
        const family = await loadPreviewFont(path, slot);
        setSlotFonts((prev) => ({
          ...prev,
          [slot]: { path, name: pathBasename(path), family },
        }));
        // Picking a font for a slot only makes sense if that slot is applied.
        selectSlot(slot);
      } catch (err) {
        setError(errorText(err));
      }
    },
    [pickFont, selectSlot],
  );

  const clearSlotFont = useCallback((slot: SlotMapping) => {
    clearPreviewFont(slot);
    setSlotFonts((prev) => ({ ...prev, [slot]: null }));
  }, []);

  const pickManualPath = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t.dialogs.pickWowTitle,
    });
    if (typeof selected !== "string") return;
    // Validate before saving so a wrong folder never replaces a working one.
    try {
      const result = await validateWowPath(selected);
      if (!result.basePath) {
        setError(t.errors.wowNotFound);
        return;
      }
      setError(null);
      setWowDetection(result);
      updateSettings({ manualPath: result.basePath, autoDetect: false });
      setStatus(t.status.pathUpdated);
    } catch (err) {
      setError(errorText(err));
    }
  }, [t, updateSettings]);

  /**
   * Slots with their own font become their own assignment. Every other
   * selected slot falls back to the main font, which also carries the locale
   * packs since those have no per-slot override.
   */
  const assignments = useMemo<FontAssignment[]>(() => {
    const result: FontAssignment[] = [];
    const mainSlots: SlotMapping[] = [];
    for (const slot of selectedSlots) {
      const own = slotFonts[slot];
      if (own) {
        result.push({ fontPath: own.path, mappings: [slot], localePacks: [] });
      } else if (mainFont) {
        mainSlots.push(slot);
      }
    }
    if (mainFont && (mainSlots.length > 0 || settings.localePacks.length > 0)) {
      result.push({
        fontPath: mainFont.path,
        mappings: mainSlots,
        localePacks: settings.localePacks,
      });
    }
    return result;
  }, [mainFont, selectedSlots, settings.localePacks, slotFonts]);

  const applyCount = useMemo(
    () => selectedSlots.filter((slot) => slotFonts[slot] || mainFont).length,
    [mainFont, selectedSlots, slotFonts],
  );

  const canApply = assignments.length > 0;

  const applyFont = useCallback(async () => {
    if (!activeWowPath) {
      setError(t.errors.wowNotFound);
      return;
    }
    if (assignments.length === 0) {
      setError(
        selectedSlots.length === 0 && settings.localePacks.length === 0
          ? t.errors.selectTarget
          : t.errors.dropFontFirst,
      );
      return;
    }

    const confirmed = await ask(t.dialogs.applyBody, {
      title: t.dialogs.applyTitle,
      kind: "warning",
      okLabel: t.dialogs.applyOk,
      cancelLabel: t.dialogs.applyCancel,
    });
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await applyCustomFonts(
        activeWowPath,
        gameVersion,
        assignments,
        settings.compressBackup,
      );
      let msg =
        result.applied.length === 1
          ? t.status.appliedOne
          : format(t.status.applied, { count: result.applied.length });
      if (result.slugCacheCleared > 0) {
        msg +=
          result.slugCacheCleared === 1
            ? t.status.slugClearedOne
            : format(t.status.slugCleared, { count: result.slugCacheCleared });
      }
      if (result.compressedBackup) {
        msg += format(t.status.backupZip, { path: result.compressedBackup });
      }
      setStatus(msg);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsBusy(false);
    }
  }, [
    activeWowPath,
    assignments,
    format,
    gameVersion,
    selectedSlots.length,
    settings.compressBackup,
    settings.localePacks.length,
    t,
  ]);

  const restoreDefaultFonts = useCallback(async () => {
    if (!activeWowPath) {
      setError(t.errors.wowNotFound);
      return;
    }

    const confirmed = await ask(t.dialogs.restoreBody, {
      title: t.dialogs.restoreTitle,
      kind: "warning",
      okLabel: t.dialogs.restoreOk,
      cancelLabel: t.dialogs.restoreCancel,
    });
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setStatus(null);
    try {
      const restored = await restoreDefaults(activeWowPath, gameVersion);
      setStatus(
        restored.length === 0
          ? t.status.nothingToRestore
          : restored.length === 1
            ? t.status.restoredOne
            : format(t.status.restored, { count: restored.length }),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setIsBusy(false);
    }
  }, [activeWowPath, format, gameVersion, t]);

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      gameVersion,
      setGameVersion,
      settingsOpen,
      setSettingsOpen,
      settings,
      updateSettings,
      selectedSlots,
      toggleSlot,
      toggleLocalePack,
      wowDetection,
      activeWowPath,
      mainFont,
      isLoadingFont,
      setFontFromPath,
      pickFontFile,
      clearFont,
      slotFonts,
      setSlotFont,
      clearSlotFont,
      applyCount,
      canApply,
      pickManualPath,
      applyFont,
      restoreDefaultFonts,
      status,
      error,
      isBusy,
    }),
    [
      locale,
      setLocale,
      gameVersion,
      settingsOpen,
      settings,
      updateSettings,
      selectedSlots,
      toggleSlot,
      toggleLocalePack,
      wowDetection,
      activeWowPath,
      mainFont,
      isLoadingFont,
      setFontFromPath,
      pickFontFile,
      clearFont,
      slotFonts,
      setSlotFont,
      clearSlotFont,
      applyCount,
      canApply,
      pickManualPath,
      applyFont,
      restoreDefaultFonts,
      status,
      error,
      isBusy,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadInitialState(), []);
  const [locale, setLocale] = useState<AppLocale>(initial.locale);

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <AppProviderInner locale={locale} setLocale={setLocale} initial={initial}>
        {children}
      </AppProviderInner>
    </I18nProvider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
