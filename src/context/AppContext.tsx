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
import type { AppSettings, DetectResult, FontMapping, GameVersion } from "../types";

interface AppContextValue {
  gameVersion: GameVersion;
  setGameVersion: (v: GameVersion) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleFontMapping: (mapping: FontMapping) => void;
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
  includeCyrillic: false,
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

function loadInitialState() {
  const persisted = loadPersistedSettings();
  return {
    gameVersion: persisted?.gameVersion ?? ("retail" as GameVersion),
    settings: { ...defaultSettings, ...persisted?.settings },
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadInitialState(), []);
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
    savePersistedSettings({ gameVersion, settings });
  }, [gameVersion, settings]);

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

  const setFontFromPath = useCallback(async (path: string) => {
    setError(null);
    setStatus(null);
    setIsLoadingFont(true);
    try {
      const family = await loadPreviewFont(path);
      setFontPath(path);
      setFontName(pathBasename(path));
      setPreviewFamily(family);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingFont(false);
    }
  }, []);

  const clearFont = useCallback(() => {
    clearPreviewFont();
    setFontPath(null);
    setFontName(null);
    setPreviewFamily(null);
  }, []);

  const pickFontFile = useCallback(async () => {
    const selected = await open({
      multiple: false,
      title: "Select Font File",
      filters: [{ name: "Font", extensions: ["ttf", "otf"] }],
    });
    if (typeof selected === "string") {
      await setFontFromPath(selected);
    }
  }, [setFontFromPath]);

  const pickManualPath = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select World of Warcraft Folder",
    });

    if (typeof selected === "string") {
      updateSettings({ manualPath: selected, autoDetect: false });
      try {
        const result = await validateWowPath(selected);
        setWowDetection(result);
        setStatus("WoW path updated.");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [updateSettings]);

  const applyFont = useCallback(async () => {
    if (!fontPath) {
      setError("Drop a font file first.");
      return;
    }
    if (settings.fontMappings.length === 0) {
      setError("Select at least one font target in Settings.");
      return;
    }
    if (!activeWowPath) {
      setError("WoW installation not found. Set a path in Settings.");
      return;
    }

    const confirmed = await ask(
      "This will replace WoW font files in your Fonts folder. Originals are backed up first. Restart WoW after applying.",
      { title: "Apply Custom Font?", kind: "warning", okLabel: "Apply", cancelLabel: "Cancel" },
    );
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
        settings.includeCyrillic,
        settings.compressBackup,
      );
      let msg = `Applied to ${result.applied.length} slot${result.applied.length === 1 ? "" : "s"}. Restart WoW to see changes.`;
      if (result.slugCacheCleared > 0) {
        msg += ` Cleared ${result.slugCacheCleared} Slug cache file${result.slugCacheCleared === 1 ? "" : "s"}.`;
      }
      if (result.compressedBackup) {
        msg += ` Backup zip: ${result.compressedBackup}`;
      }
      setStatus(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  }, [activeWowPath, fontPath, gameVersion, settings]);

  const restoreDefaultFonts = useCallback(async () => {
    if (!activeWowPath) {
      setError("WoW installation not found.");
      return;
    }

    const confirmed = await ask(
      "Restore original fonts from the .backup folder?",
      { title: "Restore Defaults?", kind: "warning", okLabel: "Restore", cancelLabel: "Cancel" },
    );
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setStatus(null);

    try {
      const restored = await restoreDefaults(activeWowPath, gameVersion);
      setStatus(
        restored.length > 0
          ? `Restored ${restored.length} font${restored.length === 1 ? "" : "s"} from backup.`
          : "Nothing to restore.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsBusy(false);
    }
  }, [activeWowPath, gameVersion]);

  const value = useMemo<AppContextValue>(
    () => ({
      gameVersion,
      setGameVersion,
      settingsOpen,
      setSettingsOpen,
      settings,
      updateSettings,
      toggleFontMapping,
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
      gameVersion,
      settingsOpen,
      settings,
      updateSettings,
      toggleFontMapping,
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
