import { memo } from "react";

type LogoSize = "small" | "about";

const SIZE: Record<LogoSize, string> = {
  small: "h-7 w-7",
  about: "h-10 w-10",
};

interface LogoProps {
  size?: LogoSize;
}

/** In-app logo. The title bar uses a processed ICO separately. */
export const Logo = memo(function Logo({ size = "small" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`${SIZE[size]} shrink-0 object-contain`}
    />
  );
});
