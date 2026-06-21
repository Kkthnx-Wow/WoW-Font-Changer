import { useApp } from "../context/AppContext";

export function Footer() {
  const {
    applyFont,
    restoreDefaultFonts,
    isBusy,
    isLoadingFont,
    fontPath,
    status,
    error,
  } = useApp();

  return (
    <footer className="shrink-0 px-4 pb-4 pt-2 space-y-2">
      {(status || error) && (
        <p
          className={`status-text text-center text-[10px] leading-snug ${
            error ? "text-red-400/90" : "text-gold/75"
          }`}
        >
          {error ?? status}
        </p>
      )}

      <button
        type="button"
        disabled={isBusy || isLoadingFont || !fontPath}
        onClick={() => void applyFont()}
        className="animate-pulse-glow w-full rounded-lg border border-gold/50 bg-gradient-to-b from-gold/25 to-gold-dim/20 py-2.5 text-[13px] font-semibold text-gold-bright transition-all hover:from-gold/35 hover:to-gold-dim/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:animate-none"
      >
        {isBusy ? "Working…" : isLoadingFont ? "Loading…" : "Apply Font"}
      </button>

      <button
        type="button"
        disabled={isBusy}
        onClick={() => void restoreDefaultFonts()}
        className="w-full rounded-lg border border-white/10 bg-charcoal-mid/50 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/20 hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Restore Defaults
      </button>
    </footer>
  );
}
