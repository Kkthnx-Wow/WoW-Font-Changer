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
    <div className="rounded-lg border border-line bg-bg px-3 py-3">
      <div className="flex items-center gap-3">
        <Logo size="about" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-text">{APP_NAME}</p>
          <p className="text-[12px] text-muted">
            v{APP_VERSION}, {APP_AUTHOR}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-text-2">{APP_DESCRIPTION}</p>

      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-muted marker:text-gold">
        {APP_FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
