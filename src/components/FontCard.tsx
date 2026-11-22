import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import { CloseIcon } from "./Icons";
import { btnIcon, btnSecondary } from "./ui";

function stripExtension(name: string): string {
  return name.replace(/\.(ttf|otf)$/i, "");
}

/** The main font. Empty, it invites a drop. Loaded, it shows itself. */
export function FontCard() {
  const { mainFont, isLoadingFont, pickFontFile, clearFont } = useApp();
  const { t } = useI18n();

  if (isLoadingFont) {
    return (
      <section className="flex h-[72px] shrink-0 items-center gap-3 rounded-lg border border-line bg-surface px-4">
        <span
          aria-hidden
          className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold"
        />
        <p role="status" className="text-[13px] text-text-2">
          {t.dropzone.loadingPreview}
        </p>
      </section>
    );
  }

  if (!mainFont) {
    return (
      <section className="flex min-h-[72px] shrink-0 items-center gap-3 rounded-lg border border-dashed border-control bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text">{t.dropzone.dragDrop}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">
            {t.dropzone.dragDropHint}
          </p>
        </div>
        <button type="button" onClick={() => void pickFontFile()} className={btnSecondary}>
          {t.dropzone.browseFont}
        </button>
      </section>
    );
  }

  return (
    <section className="flex h-[72px] shrink-0 items-center gap-2 rounded-lg border border-line bg-surface pr-2 pl-4">
      <div className="min-w-0 flex-1">
        <p
          style={{ fontFamily: `"${mainFont.family}", var(--font-sans)` }}
          className="truncate text-[21px] leading-tight text-text"
        >
          {stripExtension(mainFont.name)}
        </p>
        <p className="selectable truncate text-[12px] text-muted" title={mainFont.path}>
          {mainFont.name}
        </p>
      </div>
      <button type="button" onClick={() => void pickFontFile()} className={btnSecondary}>
        {t.dropzone.change}
      </button>
      <button
        type="button"
        onClick={clearFont}
        aria-label={t.dropzone.clear}
        title={t.dropzone.clear}
        className={btnIcon}
      >
        <CloseIcon />
      </button>
    </section>
  );
}
