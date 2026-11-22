import { useEffect, useRef, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { APP_LOCALES, useAutoDetectHint, useI18n } from "../i18n";
import { Toggle } from "./Toggle";
import { AboutSection } from "./AboutSection";
import { CloseIcon } from "./Icons";
import { btnIcon, btnSecondary } from "./ui";
import { getFlavorPath, LOCALE_PACK_FILES, LOCALE_PACK_IDS } from "../types";

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text">{title}</p>
        <p className="text-[12px] leading-snug text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsDrawer() {
  const {
    setSettingsOpen,
    settings,
    updateSettings,
    toggleLocalePack,
    pickManualPath,
    wowDetection,
    activeWowPath,
    gameVersion,
    locale,
    setLocale,
  } = useApp();
  const { t } = useI18n();
  const autoDetectHint = useAutoDetectHint();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog so keyboard users land inside it.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const flavorPath = getFlavorPath(wowDetection, gameVersion);

  return (
    <>
      <div
        className="fade-in absolute inset-0 z-20 bg-black/55"
        onClick={() => setSettingsOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="drawer-panel absolute inset-y-0 right-0 z-30 flex w-[320px] flex-col border-l border-line bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <h2 id="settings-title" className="text-[14px] font-semibold text-text">
            {t.settings.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setSettingsOpen(false)}
            className={btnIcon}
            aria-label={t.settings.close}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <Row title={t.settings.language} hint={t.settings.languageHint}>
            <select
              aria-label={t.settings.language}
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="h-8 max-w-[8.5rem] rounded-md border border-control bg-raised px-2 text-[13px] text-text outline-none"
            >
              {APP_LOCALES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Row>

          <section className="space-y-3">
            <Row title={t.settings.autoDetect} hint={autoDetectHint}>
              <Toggle
                label={t.settings.autoDetect}
                checked={settings.autoDetect}
                onChange={(checked) => updateSettings({ autoDetect: checked })}
              />
            </Row>

            {!settings.autoDetect && (
              <div className="space-y-2">
                <p className="selectable truncate text-[12px] text-muted">
                  {settings.manualPath || t.settings.noPathSelected}
                </p>
                <button
                  type="button"
                  onClick={() => void pickManualPath()}
                  className={`${btnSecondary} w-full`}
                >
                  {t.settings.browseWow}
                </button>
              </div>
            )}

            <div className="rounded-md border border-line bg-bg px-3 py-2">
              <p className="text-[12px] text-muted">{t.settings.activeTarget}</p>
              <p className="selectable mt-0.5 break-all text-[12px] text-text-2">
                {flavorPath ?? activeWowPath ?? t.settings.notDetected}
              </p>
            </div>
          </section>

          <section>
            <p className="text-[13px] font-medium text-text">{t.settings.localePacks}</p>
            <p className="mb-2 text-[12px] leading-snug text-muted">
              {t.settings.localePacksHint}
            </p>
            <div className="space-y-1.5">
              {LOCALE_PACK_IDS.map((id) => {
                const checked = settings.localePacks.includes(id);
                const pack = t.localePacks[id];
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 transition-colors ${
                      checked ? "border-gold/50 bg-gold/5" : "border-line hover:border-control"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLocalePack(id)}
                      className="mt-0.5 h-4 w-4"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] text-text">{pack.label}</span>
                      <span className="block text-[12px] text-muted">{pack.description}</span>
                      {checked && (
                        <span className="selectable mt-0.5 block text-[12px] text-text-2">
                          {LOCALE_PACK_FILES[id].join(", ")}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <Row title={t.settings.compressBackup} hint={t.settings.compressBackupHint}>
            <Toggle
              label={t.settings.compressBackup}
              checked={settings.compressBackup}
              onChange={(checked) => updateSettings({ compressBackup: checked })}
            />
          </Row>

          <section>
            <p className="mb-2 text-[13px] font-medium text-text">{t.settings.about}</p>
            <AboutSection />
          </section>
        </div>
      </aside>
    </>
  );
}
