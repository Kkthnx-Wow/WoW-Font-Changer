import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import { btnSecondary } from "./ui";

export function Footer() {
  const {
    applyFont,
    restoreDefaultFonts,
    isBusy,
    isLoadingFont,
    canApply,
    applyCount,
    status,
    error,
  } = useApp();
  const { t, format } = useI18n();

  const message = error ?? status;

  let applyLabel = t.footer.applyFont;
  if (isBusy) applyLabel = t.footer.working;
  else if (isLoadingFont) applyLabel = t.footer.loading;
  else if (applyCount === 1) applyLabel = t.footer.applyOne;
  else if (applyCount > 1) applyLabel = format(t.footer.applyCount, { count: applyCount });

  return (
    <footer className="shrink-0 border-t border-line bg-surface px-4 py-3">
      {/* Always mounted so screen readers announce each new message. */}
      <p
        role="status"
        aria-live="polite"
        className={`selectable text-[12px] leading-snug ${message ? "mb-2.5" : ""} ${
          error ? "text-danger" : "text-success"
        }`}
      >
        {message}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void restoreDefaultFonts()}
          className={`${btnSecondary} h-9`}
        >
          {t.footer.restoreDefaults}
        </button>
        <button
          type="button"
          disabled={isBusy || isLoadingFont || !canApply}
          onClick={() => void applyFont()}
          className="h-9 min-w-0 flex-1 truncate rounded-md bg-gold px-3 text-[13px] font-semibold text-on-gold transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted"
        >
          {applyLabel}
        </button>
      </div>
    </footer>
  );
}
