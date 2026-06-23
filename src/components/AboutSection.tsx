import { Logo } from "./Logo";
import {
  APP_AUTHOR,
  APP_DESCRIPTION,
  APP_FEATURES,
  APP_NAME,
  APP_VERSION,
} from "../constants/app";

export function AboutSection() {
  return (
    <section className="rounded-lg border border-white/5 bg-charcoal/40 px-3 py-3">
      <div className="flex items-center gap-3">
        <Logo size="header" className="!h-10 !w-10" />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-gold-bright">{APP_NAME}</p>
          <p className="text-[10px] text-white/50">Version {APP_VERSION}</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-white/55">
        {APP_DESCRIPTION}
      </p>

      <ul className="mt-2.5 space-y-1">
        {APP_FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-1.5 text-[9px] text-white/40"
          >
            <span className="mt-0.5 text-gold/60" aria-hidden>
              ✦
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-white/5 pt-2.5">
        <p className="text-[9px] uppercase tracking-wider text-white/30">
          Created by
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-gold/80">{APP_AUTHOR}</p>
      </div>
    </section>
  );
}
