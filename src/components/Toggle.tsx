interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/** Padding-based switch, the knob stays inside the track at both positions. */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border p-0.5 transition-colors duration-150 ${
        checked ? "border-gold bg-gold" : "border-control bg-raised"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none block h-3.5 w-3.5 rounded-full transition-transform duration-150 ${
          checked ? "translate-x-4 bg-on-gold" : "translate-x-0 bg-text-2"
        }`}
      />
    </button>
  );
}
