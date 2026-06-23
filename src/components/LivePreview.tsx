import { memo } from "react";
import { useI18n } from "../i18n";

interface LivePreviewProps {
  previewFamily: string | null;
}

export const LivePreview = memo(function LivePreview({
  previewFamily,
}: LivePreviewProps) {
  const { t } = useI18n();

  const combatStyle = previewFamily
    ? { fontFamily: `"${previewFamily}", serif` }
    : undefined;
  const questStyle = previewFamily
    ? { fontFamily: `"${previewFamily}", "Times New Roman", serif` }
    : undefined;
  const chatStyle = previewFamily
    ? { fontFamily: `"${previewFamily}", system-ui, sans-serif` }
    : undefined;

  return (
    <div className="mt-3 space-y-2.5 rounded-lg border border-white/5 bg-charcoal/60 p-3">
      <p className="text-[9px] font-medium uppercase tracking-widest text-gold/70">
        {t.preview.title}
      </p>

      <div className="relative overflow-hidden rounded-md bg-gradient-to-b from-[#1f1208]/80 to-[#0a0a0c]/90 px-3 py-2.5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgb(255,180,40,0.12),transparent_60%)]" />
        <p
          style={combatStyle}
          className="relative text-center text-[22px] font-bold leading-none text-[#ffcc33] drop-shadow-[0_0_8px_rgb(255,200,50,0.55)]"
        >
          {t.preview.combatSample}
        </p>
        <p className="relative mt-0.5 text-center text-[8px] uppercase tracking-wider text-white/30">
          {t.preview.combatLabel}
        </p>
      </div>

      <div className="rounded-md border border-gold/15 bg-[#1a1510]/70 px-3 py-2">
        <p
          style={questStyle}
          className="text-[15px] font-semibold text-[#f0e6c8] drop-shadow-sm"
        >
          {t.preview.questSample}
        </p>
        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-gold/50">
          {t.preview.questLabel}
        </p>
      </div>

      <div className="rounded-md bg-[#0f1118]/90 px-3 py-2">
        <p style={chatStyle} className="text-[12px] text-[#c8d0e0]">
          <span className="text-[#40c040]">[Guild]</span>{" "}
          <span className="text-[#ffd100]">{t.preview.chatPlayer}:</span>{" "}
          {t.preview.chatSample}
        </p>
        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-white/30">
          {t.preview.chatLabel}
        </p>
      </div>
    </div>
  );
});
