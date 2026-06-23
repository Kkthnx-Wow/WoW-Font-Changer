import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { AppLocale, Translation } from "./types";
import { en } from "./locales/en";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { it } from "./locales/it";
import { ptBR } from "./locales/pt-BR";
import { ru } from "./locales/ru";
import { ko } from "./locales/ko";
import { zhCN } from "./locales/zh-CN";
import { zhTW } from "./locales/zh-TW";

const catalogs: Record<AppLocale, Translation> = {
  en,
  de,
  es,
  fr,
  it,
  "pt-BR": ptBR,
  ru,
  ko,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};

const BROWSER_LOCALE_MAP: Record<string, AppLocale> = {
  en: "en",
  de: "de",
  es: "es",
  fr: "fr",
  it: "it",
  pt: "pt-BR",
  ru: "ru",
  ko: "ko",
  zh: "zh-CN",
};

export function detectBrowserLocale(): AppLocale {
  const tags = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of tags) {
    const normalized = tag.replace("_", "-");
    if (normalized in catalogs) {
      return normalized as AppLocale;
    }
    const base = normalized.split("-")[0];
    if (base === "zh") {
      return normalized.toLowerCase().includes("tw") ||
        normalized.toLowerCase().includes("hk")
        ? "zh-TW"
        : "zh-CN";
    }
    if (base in BROWSER_LOCALE_MAP) {
      return BROWSER_LOCALE_MAP[base];
    }
  }

  return "en";
}

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: Translation;
  format: (template: string, vars: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  setLocale,
  children,
}: {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  children: ReactNode;
}) {
  const t = catalogs[locale] ?? en;

  const format = useCallback(
    (template: string, vars: Record<string, string | number>) => {
      return Object.entries(vars).reduce(
        (result, [key, value]) =>
          result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value)),
        template,
      );
    },
    [],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, format }),
    [locale, setLocale, t, format],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useAutoDetectHint(): string {
  const { t } = useI18n();
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return t.settings.autoDetectHintWindows;
  if (ua.includes("mac")) return t.settings.autoDetectHintMac;
  return t.settings.autoDetectHintLinux;
}

export { APP_LOCALES } from "./types";
