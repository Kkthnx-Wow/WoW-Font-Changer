import { memo } from "react";
import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";
import { LivePreview } from "./LivePreview";

interface DropzoneProps {
  isDragging: boolean;
}

export const Dropzone = memo(function Dropzone({ isDragging }: DropzoneProps) {
  const {
    fontPath,
    fontName,
    previewFamily,
    isLoadingFont,
    clearFont,
    pickFontFile,
  } = useApp();

  return (
    <section
      className={`relative mx-4 flex flex-1 min-h-0 flex-col rounded-xl border-2 border-dashed p-4 transition-all duration-300 ease-out backdrop-blur-sm ${
        isDragging
          ? "scale-[1.015] border-gold-bright bg-gold/5 shadow-[0_0_28px_rgb(212,175,55,0.35)]"
          : fontPath
            ? "border-gold/35 bg-glass"
            : "border-white/12 bg-glass hover:border-gold/25"
      }`}
    >
      {isLoadingFont ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <p className="text-[12px] text-white/60">Loading font preview…</p>
        </div>
      ) : !fontPath ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div
            className={`mb-4 transition-transform duration-300 ${
              isDragging ? "scale-105" : ""
            }`}
          >
            <Logo size="hero" />
          </div>
          <p className="text-[13px] font-medium text-white/80">
            Drag &amp; Drop .ttf / .otf here
          </p>
          <p className="mt-1 max-w-[260px] text-[10px] text-white/40">
            Preview updates instantly. .otf sources are saved as .ttf for WoW.
          </p>
          <button
            type="button"
            onClick={() => void pickFontFile()}
            className="mt-3 rounded-md border border-glass-border bg-charcoal-mid/60 px-3 py-1.5 text-[10px] text-gold/80 transition-colors hover:border-gold/30"
          >
            Browse Font File
          </button>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gold/60">
                Loaded font
              </p>
              <p className="truncate text-[13px] font-medium text-white/90 select-text">
                {fontName}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFont}
              className="shrink-0 rounded px-2 py-0.5 text-[10px] text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <LivePreview previewFamily={previewFamily} />
          </div>
        </div>
      )}
    </section>
  );
});
