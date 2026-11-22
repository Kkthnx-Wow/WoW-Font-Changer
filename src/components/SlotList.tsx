import type { CSSProperties, ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import { FONT_MAPPING_TARGETS, SLOT_MAPPING_IDS, type SlotMapping } from "../types";
import { CloseIcon, FontFileIcon } from "./Icons";
import { btnGhost } from "./ui";

/** Each sample copies how WoW uses that file, in size and color. */
const SAMPLE_SIZE: Record<SlotMapping, string> = {
  combat: "text-[20px] font-bold",
  chat: "text-[13px]",
  mail: "text-[16px]",
  quest: "text-[14px]",
};

const SAMPLE_COLOR: Record<SlotMapping, string> = {
  combat: "text-text",
  chat: "text-guild",
  mail: "text-gold",
  quest: "text-text",
};

/**
 * The slot list is the preview. Every row renders its sample in the font that
 * slot will get, so what you see is what Apply writes.
 */
export function SlotList() {
  const { selectedSlots } = useApp();
  const { t } = useI18n();

  return (
    <section aria-labelledby="slots-title" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 flex items-baseline justify-between px-1">
        <h2
          id="slots-title"
          className="text-[12px] font-semibold uppercase tracking-wide text-text-2"
        >
          {t.slots.title}
        </h2>
        <span className="text-[12px] text-muted">
          {selectedSlots.length}/{SLOT_MAPPING_IDS.length}
        </span>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {SLOT_MAPPING_IDS.map((slot) => (
          <SlotRow key={slot} slot={slot} />
        ))}
      </ul>
    </section>
  );
}

function SlotRow({ slot }: { slot: SlotMapping }) {
  const { selectedSlots, toggleSlot, slotFonts, mainFont, setSlotFont, clearSlotFont } =
    useApp();
  const { t } = useI18n();

  const checked = selectedSlots.includes(slot);
  const own = slotFonts[slot];
  const font = own ?? mainFont;
  const live = checked && font !== null;
  const inputId = `slot-${slot}`;

  const sampleStyle: CSSProperties | undefined = live
    ? { fontFamily: `"${font.family}", var(--font-sans)` }
    : undefined;

  let note: string | null = null;
  if (!checked) note = t.slots.notChanged;
  else if (!font) note = t.slots.needsFont;

  return (
    <li
      className={`rounded-lg border px-3 py-2 transition-colors ${
        checked ? "border-line bg-surface" : "border-line/60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={() => toggleSlot(slot)}
          className="h-4 w-4 shrink-0 cursor-pointer"
        />
        <label htmlFor={inputId} className="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2">
          <span className="truncate text-[13px] font-medium text-text">
            {t.fontMappings[slot].label}
          </span>
          <span className="shrink-0 text-[12px] text-muted">{FONT_MAPPING_TARGETS[slot]}</span>
        </label>

        {own ? (
          <span className="flex h-7 max-w-[9.5rem] items-center gap-0.5 rounded-md border border-gold/50 bg-gold/10 pl-2 text-[12px] text-gold">
            <span className="truncate" title={own.path}>
              {own.name}
            </span>
            <button
              type="button"
              onClick={() => clearSlotFont(slot)}
              aria-label={`${t.slots.useMain}, ${t.fontMappings[slot].label}`}
              title={t.slots.useMain}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-gold hover:bg-gold/15"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void setSlotFont(slot)}
            aria-label={`${t.slots.ownFont}, ${t.fontMappings[slot].label}`}
            className={btnGhost}
          >
            <FontFileIcon />
            {t.slots.ownFont}
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 pl-[26px]">
        <p
          style={sampleStyle}
          title={t.fontMappings[slot].description}
          className={`min-w-0 flex-1 truncate leading-snug ${SAMPLE_SIZE[slot]} ${
            live ? SAMPLE_COLOR[slot] : "text-muted"
          }`}
        >
          <Sample slot={slot} />
        </p>
        {note && <span className="shrink-0 text-[12px] text-muted">{note}</span>}
      </div>
    </li>
  );
}

function Sample({ slot }: { slot: SlotMapping }): ReactNode {
  const { t } = useI18n();
  switch (slot) {
    case "combat":
      return t.preview.combatSample;
    case "chat":
      return `[Guild] ${t.preview.chatPlayer}: ${t.preview.chatSample}`;
    case "mail":
      return t.preview.mailSample;
    case "quest":
      return t.preview.questSample;
  }
}
