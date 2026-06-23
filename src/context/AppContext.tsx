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
  detectBrowserLocale,
  I18nProvider,
  useI18n,
} from "../i18n";
import type { AppLocale } from "../i18n/types";
import {
  applyCustomFont,
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
  FontMapping,
  GameVersion,
  LocalePack,
} from "../types";
import { GAME_VERSION_GROUPS, isVersionAvailable } from "../types";

interface AppContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  gameVersion: GameVersion;
  setGameVersion: (v: GameVersion) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleFontMapping: (mapping: FontMapping) => void;
  toggleLocalePack: (pack: LocalePack) => void;
  wowDetection: DetectResult | null;
  activeWowPath: string | null;
  fontPath: string | null;
  fontName: string | null;
  previewFamily: string | null;
  isLoadingFont: boolean;
  setFontFromPath: (path: string) => Promise<void>;
  pickFontFile: () => Promise<void>;
  clearFont: () => void;
  pickManualPath: () => Promise<void>;
  applyFont: () => Promise<void>;
  restoreDefaultFonts: () => Promise<void>;
  status: string | null;
  error: string | null;
  isBusy: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_INDIVIDUAL_MAPPINGS: FontMapping[] = [
  "combat",
  "chat",
  "mail",
  "quest",
];

const defaultSettings: AppSettings = {
  autoDetect: true,
  manualPath: "",
  fontMappings: ["all"],
  localePacks: [],
  compressBackup: false,
};

function pathBasename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.split("/").pop() ?? path;
}

function resolveActivePath(
  detection: DetectResult | null,
  settings: AppSettings,
): string | null {
  if (settings.autoDetect && detection?.basePath) {
    return detection.basePath;
  }
  if (!settings.autoDetect && settings.manualPath) {
    return settings.manualPath;
  }
  return detection?.basePath ?? null;
}

function firstAvailableVersion(detection: DetectResult | null): GameVersion {
  if (!detection) return "retail";
  for (const group of GAME_VERSION_GROUPS) {
    for (const version of group.versions) {
      if (isVersionAvailable(version, detection)) {
        return version;
      }
    }
  }
  return "retail";
}

function loadInitialState() {
  const persisted = loadPersistedSettings();
  return {
    locale: persisted?.locale ?? detectBrowserLocale(),
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
  const [fontPath, setFontPath] = useState<string | null>(null);
  const [fontName, setFontName] = useState<string | null>(null);
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);
  const [isLoadingFont, setIsLoadingFont] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const activeWowPath = useMemo(
    () => resolveActivePath(wowDetection, settings),
    [wowDetection, settings],
  );

  useEffect(() => {
    savePersistedSettings({ locale, gameVersion, settings });
  }, [locale, gameVersion, settings]);

  const refreshDetection = useCallback(async () => {
    try {
      const result = settings.autoDetect
        ? await detectWowPath()
        : settings.manualPath
          ? await validateWowPath(settings.manualPath)
          : await detectWowPath();
      setWowDetection(result);
    } catch {
      setWowDetection(null);
    }
  }, [settings.autoDetect, settings.manualPath]);

  useEffect(() => {
    void refreshDetection();
  }, [refreshDetection]);

  useEffect(() => {
    if (!wowDetection) return;
    if (!isVersionAvailable(gameVersion, wowDetection)) {
      setGameVersion(firstAvailableVersion(wowDetection));
    }
  }, [wowDetection, gameVersion]);

  useEffect(() => {
    return () => clearPreviewFont();
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleFontMapping = useCallback((mapping: FontMapping) => {
    setSettings((prev) => {
      if (mapping === "all") {
        if (prev.fontMappings.includes("all")) {
          return { ...prev, fontMappings: [...DEFAULT_INDIVIDUAL_MAPPINGS] };
        }
        return { ...prev, fontMappings: ["all"] };
      }

      const withoutAll = prev.fontMappings.filter((m) => m !== "all");
      const exists = withoutAll.includes(mapping);
      const next = exists
        ? withoutAll.filter((m) => m !== mapping)
        : [...withoutAll, mapping];

      return {
        ...prev,
        fontMappings: next.length === 0 ? ["combat"] : next,
      };
    });
  }, []);

  const toggleLocalePack = useCallback((pack: LocalePack) => {
    setSettings((prev) => {
      const exists = prev.localePacks.includes(pack);
      const next = exists
        ? prev.localePacks.filter((p) => p !== pack)
        : [...prev.localePacks, pack];
      return { ...prev, localePacks: next };
    });
  }, []);

  const setFontFromPath = useCallback(
    async (path: string) => {
      setError(null);
      setStatus(null);
      setIsLoadingFont(true);
      try {
        const lower = path.toLowerCase();
        if (!lower.endsWith(".ttf") && !lower.endsWith(".otf")) {
          setError(t.errors.fontMustBeTtfOtf);
          return;
        }
        const family = await loadPreviewFont(path);
        setFontPath(path);
        setFontName(pathBasename(path));
        setPreviewFamily(family);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingFont(false);
      }
    },
    [t],
  );

  const clearFont = useCallback(() => {
    clearPreviewFont();
    setFontPath(null);
    setFontName(null);
    setPreviewFamily(null);
  }, []);

  const pickFontFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      title: t.dialogs.pickFontTitle,
      filters: [{ name: t.dialogs.fontFilter, extensions: ["ttf", "otf"] }],
    });
    if (typeof selected === "string") {
      await setFontFromPath(selected);
    }
  }, [setFontFromPath, t]);

  const pickManualPath = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t.dialogs.pickWowTitle,
    });

    if (typeof selected === "string") {
      updateSettings({ manualPath: selected, autoDetect: false });
      try {
        const result = await validateWowPath(selected);
        if (!result.basePath) {
          setError(t.errors.wowNotFound);
          return;
        }
        setWowDetection(result);
        setStatus(t.status.pathUpdated);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [t, updateSettings]);

  const applyFont = useCallback(async () => {
    if (!fontPath) {
      setError(t.errors.dropFontFirst);
      return;
    }
    if (settings.fontMappings.length === 0) {
      setError(t.errors.selectTarget);
      return;
    }
    if (!activeWowPath) {
      setError(t.errors.wowNotFound);
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
      const result = await applyCustomFont(
        activeWowPath,
        gameVersion,
        fontPath,
        settings.fontMappings,
        settings.localePacks,
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  }, [activeWowPath, fontPath, format, gameVersion, settings, t]);

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
      setError(err instanceof Error ? err.message : String(err));
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
      toggleFontMapping,
      toggleLocalePack,
      wowDetection,
      activeWowPath,
      fontPath,
      fontName,
      previewFamily,
      isLoadingFont,
      setFontFromPath,
      pickFontFile,
      clearFont,
      pickManualPath,
      applyFont,
      restoreDefaultFonts,
      status,
      error,
      isBusy,
    }),
    [
      locale,
      gameVersion,
      settingsOpen,
      settings,
      updateSettings,
      toggleFontMapping,
      toggleLocalePack,
      wowDetection,
      activeWowPath,
      fontPath,
      fontName,
      previewFamily,
      isLoadingFont,
      setFontFromPath,
      pickFontFile,
      clearFont,
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
