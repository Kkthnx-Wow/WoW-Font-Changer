import { useApp } from "../context/AppContext";
import { Toggle } from "./Toggle";
import { AboutSection } from "./AboutSection";
import { FONT_MAPPING_OPTIONS, WOW_CYRILLIC_FONT_FILES } from "../types";

export function SettingsDrawer() {
  const {
    settingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    toggleFontMapping,
    pickManualPath,
    wowDetection,
    activeWowPath,
    gameVersion,
  } = useApp();

  const replaceAll = settings.fontMappings.includes("all");

  const flavorPath =
    gameVersion === "retail"
      ? wowDetection?.retail
      : gameVersion === "classic"
        ? wowDetection?.classic
        : wowDetection?.era;

  if (!settingsOpen) return null;

  return (
    <>
      <div
        className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] drawer-backdrop"
        onClick={() => setSettingsOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="absolute inset-y-0 right-0 z-30 flex w-[300px] flex-col border-l border-glass-border bg-charcoal-light/95 backdrop-blur-xl shadow-[-8px_0_32px_rgb(0,0,0,0.45)] drawer-panel"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-gold-bright">
            Settings
          </h2>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70"
            aria-label="Close settings"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/85">
                  Auto-Detect WoW
                </p>
                <p className="text-[9px] text-white/40">
                  Scan registry &amp; common paths
                </p>
              </div>
              <Toggle
                label="Auto-detect WoW installation"
                checked={settings.autoDetect}
                onChange={(checked) => updateSettings({ autoDetect: checked })}
              />
            </div>

            {!settings.autoDetect && (
              <div className="mt-3 space-y-2">
                <p className="truncate text-[9px] text-white/35 select-text">
                  {settings.manualPath || "No path selected"}
                </p>
                <button
                  type="button"
                  onClick={() => void pickManualPath()}
                  className="w-full rounded-md border border-glass-border bg-charcoal-mid/60 py-1.5 text-[10px] text-gold/80 hover:border-gold/30"
                >
                  Browse WoW Folder
                </button>
              </div>
            )}

            <div className="mt-3 rounded-md border border-white/5 bg-charcoal/50 px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-white/30">
                Active target
              </p>
              <p className="mt-0.5 truncate text-[10px] text-gold/70 select-text">
                {flavorPath ?? activeWowPath ?? "Not detected"}
              </p>
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">
              Font Targets
            </p>
                  <p className="mb-2 text-[9px] leading-relaxed text-white/35">
                    WoW requires exact file names (case-sensitive) with a{" "}
                    <span className="text-gold/70">.ttf</span> extension — even if your
                    source font is .otf. Apply also clears stale{" "}
                    <span className="text-gold/70">.slug</span> /{" "}
                    <span className="text-gold/70">.slugo</span> GPU cache files.
                  </p>
            <div className="space-y-1.5">
              {FONT_MAPPING_OPTIONS.map((option) => {
                const isAllOption = option.id === "all";
                const disabled = replaceAll && !isAllOption;
                const checked = settings.fontMappings.includes(option.id);

                return (
                  <label
                    key={option.id}
                    aria-disabled={disabled}
                    className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors ${
                      disabled
                        ? "cursor-not-allowed border-white/5 bg-charcoal/20 opacity-45"
                        : checked
                          ? "cursor-pointer border-gold/30 bg-gold/5"
                          : "cursor-pointer border-white/5 bg-charcoal/40 hover:border-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleFontMapping(option.id)}
                      className="mt-0.5 accent-[#d4af37] disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-[11px] ${
                          disabled ? "text-white/35" : "text-white/85"
                        }`}
                      >
                        {option.label}
                      </span>
                      <span
                        className={`block text-[9px] ${
                          disabled ? "text-white/20" : "text-white/40"
                        }`}
                      >
                        {option.description} · {option.target}
                        {settings.includeCyrillic && option.cyrTarget && (
                          <>
                            {" "}
                            ·{" "}
                            <span className="text-gold/55">
                              {option.cyrTarget}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/85">
                  Include Cyrillic
                </p>
                <p className="text-[9px] leading-relaxed text-white/40">
                  Also write <span className="text-gold/60">_CYR.ttf</span>{" "}
                  variants. Quest UI uses{" "}
                  <span className="text-gold/60">FRIZQT___CYR.ttf</span> (three
                  underscores).
                </p>
              </div>
              <Toggle
                label="Include Cyrillic font variants"
                checked={settings.includeCyrillic}
                onChange={(checked) =>
                  updateSettings({ includeCyrillic: checked })
                }
              />
            </div>
            {settings.includeCyrillic && (
              <div className="mt-2 rounded-md border border-gold/15 bg-gold/5 px-2.5 py-2">
                <p className="text-[9px] uppercase tracking-wider text-gold/60">
                  Also applies
                </p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-white/45 select-text">
                  {WOW_CYRILLIC_FONT_FILES.join(", ")}
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/85">
                  Compress Backup
                </p>
                <p className="text-[9px] text-white/40">
                  Zip .backup folder after apply
                </p>
              </div>
              <Toggle
                label="Compress backup folder"
                checked={settings.compressBackup}
                onChange={(checked) =>
                  updateSettings({ compressBackup: checked })
                }
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">About</p>
            <AboutSection />
          </section>
        </div>
      </aside>
    </>
  );
}
