import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";
import { GAME_VERSION_LABELS, type DetectResult, type GameVersion } from "../types";
import { APP_VERSION } from "../constants/app";

const VERSIONS: GameVersion[] = ["retail", "classic", "era"];

function isVersionAvailable(
  version: GameVersion,
  detection: DetectResult | null,
): boolean {
  if (!detection) return true;
  if (version === "retail") return Boolean(detection.retail);
  if (version === "classic") return Boolean(detection.classic);
  return Boolean(detection.era);
}

export function Header() {
  const { gameVersion, setGameVersion, settingsOpen, setSettingsOpen, wowDetection } =
    useApp();

  return (
    <header className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
      <div className="flex min-w-0 items-center gap-3">
        <Logo size="header" />
        <div className="min-w-0">
          <h1 className="text-[13px] font-semibold tracking-wide text-gold-bright uppercase">
            WoW Font Changer
          </h1>
          <p className="text-[10px] text-white/40 truncate">
            v{APP_VERSION} · Compact font widget
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={gameVersion}
          onChange={(e) => setGameVersion(e.target.value as GameVersion)}
          className="h-7 rounded-md border border-glass-border bg-charcoal-mid/80 px-2 text-[11px] text-white/85 outline-none focus:border-gold/50 transition-colors cursor-pointer"
        >
          {VERSIONS.map((v) => {
            const available = isVersionAvailable(v, wowDetection);
            return (
              <option
                key={v}
                value={v}
                disabled={!available}
                className="bg-charcoal-light"
              >
                {GAME_VERSION_LABELS[v]}
                {!available ? " (not installed)" : ""}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          aria-label="Open settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="group flex h-7 w-7 items-center justify-center rounded-md border border-glass-border bg-glass backdrop-blur-md transition-colors hover:border-gold/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className={`h-3.5 w-3.5 text-gold transition-transform duration-500 ease-out group-hover:rotate-90 ${
              settingsOpen ? "rotate-90" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
