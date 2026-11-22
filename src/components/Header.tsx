import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";
import { GearIcon } from "./Icons";
import { useI18n } from "../i18n";
import {
  GAME_VERSION_GROUPS,
  getFlavorPath,
  isVersionAvailable,
  type GameVersion,
} from "../types";

/** Keep the last two path parts, which name the install and the flavor. */
function shortPath(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 2) return path;
  const sep = path.includes("\\") ? "\\" : "/";
  return `…${sep}${parts.slice(-2).join(sep)}`;
}

export function Header() {
  const {
    gameVersion,
    setGameVersion,
    settingsOpen,
    setSettingsOpen,
    wowDetection,
    activeWowPath,
  } = useApp();
  const { t } = useI18n();

  const flavorPath = getFlavorPath(wowDetection, gameVersion);
  const targetPath = flavorPath ?? activeWowPath;

  return (
    <header className="shrink-0 px-4 pt-3 pb-2">
      <div className="flex items-center gap-2.5">
        <Logo size="small" />
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-text">
          {t.app.title}
        </h1>

        <select
          aria-label={t.header.gameVersion}
          value={gameVersion}
          onChange={(e) => setGameVersion(e.target.value as GameVersion)}
          className="h-8 max-w-[9.5rem] cursor-pointer rounded-md border border-control bg-raised px-2 text-[13px] text-text outline-none transition-colors hover:border-text-2"
        >
          {GAME_VERSION_GROUPS.map((group) => (
            <optgroup key={group.id} label={t.gameGroups[group.id]}>
              {group.versions.map((v) => {
                const available = isVersionAvailable(v, wowDetection);
                return (
                  <option key={v} value={v} disabled={!available}>
                    {t.gameVersions[v]}
                    {available ? "" : t.header.notInstalled}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>

        <button
          type="button"
          aria-label={t.header.openSettings}
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-control bg-raised text-text-2 transition-colors hover:border-text-2 hover:text-text"
        >
          <GearIcon />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        title={targetPath ?? undefined}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12px] text-text-2 transition-colors hover:bg-surface"
      >
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${flavorPath ? "bg-success" : "bg-danger"}`}
        />
        <span className="truncate">
          {targetPath ? shortPath(targetPath) : t.settings.notDetected}
        </span>
      </button>
    </header>
  );
}
