import { memo } from "react";

type LogoSize = "header" | "hero";

const SIZE: Record<LogoSize, string> = {
  header: "h-12 w-12",
  hero: "h-[5.5rem] w-[5.5rem]",
};

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

/** In-app logo — brightened for dark UI; title bar uses processed ICO separately. */
export const Logo = memo(function Logo({ size = "header", className = "" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden
      draggable={false}
      decoding="async"
      className={`${SIZE[size]} shrink-0 object-contain drop-shadow-[0_0_14px_rgb(212,175,55,0.35)] ${className}`}
    />
  );
});
