import { useApp } from "../context/AppContext";
import { APP_LOCALES, useAutoDetectHint, useI18n } from "../i18n";
import { Toggle } from "./Toggle";
import { AboutSection } from "./AboutSection";
import {
  FONT_MAPPING_IDS,
  FONT_MAPPING_TARGETS,
  getFlavorPath,
  LOCALE_PACK_FILES,
  LOCALE_PACK_IDS,
  SLOT_MAPPING_IDS,
} from "../types";

export function SettingsDrawer() {
  const {
    settingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    toggleFontMapping,
    toggleLocalePack,
    pickManualPath,
    wowDetection,
    activeWowPath,
    gameVersion,
    locale,
    setLocale,
    slotFonts,
    setSlotFont,
    clearSlotFont,
  } = useApp();
  const { t } = useI18n();
  const autoDetectHint = useAutoDetectHint();

  const replaceAll = settings.fontMappings.includes("all");
  const flavorPath = getFlavorPath(wowDetection, gameVersion);

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
        aria-label={t.settings.title}
        className="absolute inset-y-0 right-0 z-30 flex w-[300px] flex-col border-l border-glass-border bg-charcoal-light/95 backdrop-blur-xl shadow-[-8px_0_32px_rgb(0,0,0,0.45)] drawer-panel"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-gold-bright">
            {t.settings.title}
          </h2>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70"
            aria-label={t.settings.close}
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
                  {t.settings.language}
                </p>
                <p className="text-[9px] text-white/40">{t.settings.languageHint}</p>
              </div>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as typeof locale)}
                className="h-7 max-w-[7.5rem] rounded-md border border-glass-border bg-charcoal-mid/80 px-2 text-[10px] text-white/85 outline-none focus:border-gold/50"
              >
                {APP_LOCALES.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-charcoal-light">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/85">
                  {t.settings.autoDetect}
                </p>
                <p className="text-[9px] text-white/40">{autoDetectHint}</p>
              </div>
              <Toggle
                label={t.settings.autoDetect}
                checked={settings.autoDetect}
                onChange={(checked) => updateSettings({ autoDetect: checked })}
              />
            </div>

            {!settings.autoDetect && (
              <div className="mt-3 space-y-2">
                <p className="truncate text-[9px] text-white/35 select-text">
                  {settings.manualPath || t.settings.noPathSelected}
                </p>
                <button
                  type="button"
                  onClick={() => void pickManualPath()}
                  className="w-full rounded-md border border-glass-border bg-charcoal-mid/60 py-1.5 text-[10px] text-gold/80 hover:border-gold/30"
                >
                  {t.settings.browseWow}
                </button>
              </div>
            )}

            <div className="mt-3 rounded-md border border-white/5 bg-charcoal/50 px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-white/30">
                {t.settings.activeTarget}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-gold/70 select-text">
                {flavorPath ?? activeWowPath ?? t.settings.notDetected}
              </p>
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">
              {t.settings.fontTargets}
            </p>
            <p className="mb-2 text-[9px] leading-relaxed text-white/35">
              {t.settings.fontTargetsHint}
            </p>
            <div className="space-y-1.5">
              {FONT_MAPPING_IDS.map((id) => {
                const isAllOption = id === "all";
                const disabled = replaceAll && !isAllOption;
                const checked = settings.fontMappings.includes(id);
                const mapping = t.fontMappings[id];
                const target = FONT_MAPPING_TARGETS[id].target;

                return (
                  <label
                    key={id}
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
                      onChange={() => toggleFontMapping(id)}
                      className="mt-0.5 accent-[#d4af37] disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block text-[11px] ${
                          disabled ? "text-white/35" : "text-white/85"
                        }`}
                      >
                        {mapping.label}
                      </span>
                      <span
                        className={`block text-[9px] ${
                          disabled ? "text-white/20" : "text-white/40"
                        }`}
                      >
                        {mapping.description}, {target}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">
              {t.settings.perSlotFonts}
            </p>
            <p className="mb-2 text-[9px] leading-relaxed text-white/35">
              {t.settings.perSlotFontsHint}
            </p>
            <div className="space-y-1.5">
              {SLOT_MAPPING_IDS.map((slot) => {
                const assigned = slotFonts[slot];
                return (
                  <div
                    key={slot}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-charcoal/40 px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <span className="block text-[11px] text-white/85">
                        {t.fontMappings[slot].label}
                      </span>
                      <span
                        className={`block truncate text-[9px] ${
                          assigned ? "text-gold/70 select-text" : "text-white/35"
                        }`}
                      >
                        {assigned ? assigned.name : t.settings.perSlotUsesMain}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void setSlotFont(slot)}
                        aria-label={t.dropzone.browseFont}
                        className="rounded p-1 text-gold/70 hover:bg-white/5 hover:text-gold-bright"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h3.1a1.5 1.5 0 0 1 1.2.6l.6.8a.5.5 0 0 0 .4.2h5.3A1.5 1.5 0 0 1 17 7.1V14a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14V5.5Z" />
                        </svg>
                      </button>
                      {assigned && (
                        <button
                          type="button"
                          onClick={() => clearSlotFont(slot)}
                          aria-label={t.dropzone.clear}
                          className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">
              {t.settings.localePacks}
            </p>
            <p className="mb-2 text-[9px] leading-relaxed text-white/35">
              {t.settings.localePacksHint}
            </p>
            <div className="space-y-1.5">
              {LOCALE_PACK_IDS.map((id) => {
                const checked = settings.localePacks.includes(id);
                const pack = t.localePacks[id];
                return (
                  <label
                    key={id}
                    className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors cursor-pointer ${
                      checked
                        ? "border-gold/30 bg-gold/5"
                        : "border-white/5 bg-charcoal/40 hover:border-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLocalePack(id)}
                      className="mt-0.5 accent-[#d4af37]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[11px] text-white/85">
                        {pack.label}
                      </span>
                      <span className="block text-[9px] text-white/40">
                        {pack.description}
                      </span>
                      {checked && (
                        <span className="mt-0.5 block text-[9px] text-gold/55 select-text">
                          {LOCALE_PACK_FILES[id].join(", ")}
                        </span>
                      )}
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
                  {t.settings.compressBackup}
                </p>
                <p className="text-[9px] text-white/40">
                  {t.settings.compressBackupHint}
                </p>
              </div>
              <Toggle
                label={t.settings.compressBackup}
                checked={settings.compressBackup}
                onChange={(checked) =>
                  updateSettings({ compressBackup: checked })
                }
              />
            </div>
          </section>

          <section>
            <p className="mb-2 text-[11px] font-medium text-white/85">
              {t.settings.about}
            </p>
            <AboutSection />
          </section>
        </div>
      </aside>
    </>
  );
}
