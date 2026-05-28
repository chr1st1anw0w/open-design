"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { id } from "./locales/id";
import { esES } from "./locales/es-ES";
import { fa } from "./locales/fa";
import { ar } from "./locales/ar";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { ptBR } from "./locales/pt-BR";
import { ru } from "./locales/ru";
import { zhCN } from "./locales/zh-CN";
import { zhTW } from "./locales/zh-TW";
import { pl } from "./locales/pl";
import { hu } from "./locales/hu";
import { fr } from "./locales/fr";
import { uk } from "./locales/uk";
import { tr } from "./locales/tr";
import { th } from "./locales/th";
import { LOCALES, type Dict, type Locale } from "./types";

export { LOCALES, LOCALE_LABEL } from "./types";
export type { Locale } from "./types";

type DictKey = keyof Dict;

const DICTS: Record<Locale, Dict> = {
  en: en,
  id: id,
  de: de,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "pt-BR": ptBR,
  "es-ES": esES,
  ru: ru,
  fa: fa,
  ar: ar,
  ja: ja,
  ko: ko,
  pl: pl,
  hu: hu,
  fr: fr,
  uk: uk,
  tr: tr,
  th: th,
};

const LS_KEY = "open-design:locale";

// Right-to-left locales. Used to flip <html dir="rtl"> when the user picks
// Farsi or Arabic.
const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(["fa", "ar"]);

function applyLocaleToDocument(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute(
    "dir",
    RTL_LOCALES.has(locale) ? "rtl" : "ltr",
  );
}

// First-run default is English. We honor an explicit user pick saved to
// localStorage but never auto-detect from `navigator.language`, so the
// initial experience is consistent and predictable.
function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem(LS_KEY) as Locale;
  if (saved && LOCALES.includes(saved)) {
    return saved;
  }

  return "en";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: DictKey, params?: Record<string, string | number>) => string;
  dict: Dict;
}

// Fallback context: used when a component renders outside <I18nProvider>
// (typically in tests). Returns English strings and a no-op setLocale so
// passive consumers like useT() don't throw. The provider strictly overrides
// this with real reactive state and persistence.
const fallbackI18n: I18nContextValue = {
  locale: "en",
  setLocale: () => {},
  t: (key, params) => {
    let val = (en[key] as string | undefined) || (key as string);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  },
  dict: en,
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initial,
}: {
  children: ReactNode;
  // Tests use `initial` to seed the locale deterministically without relying
  // on localStorage. Production never sets this.
  initial?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    initial ?? detectInitialLocale(),
  );

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LS_KEY, newLocale);
    // Apply lang/dir before reload so observers (and tests) see the change
    // synchronously, even though the reload would also re-derive them.
    applyLocaleToDocument(newLocale);
    // Force a reload to ensure all providers and side-effects see the new locale
    // consistently, and the font-family changes (if any) are applied.
    window.location.reload();
  }, []);

  // Mirror the active locale onto <html lang/dir> on mount and whenever it
  // changes (covers the initial render before any setLocale call).
  useEffect(() => {
    applyLocaleToDocument(locale);
  }, [locale]);

  const dict = useMemo(() => DICTS[locale] || en, [locale]);

  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) => {
      let val = dict[key] || en[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(`{${k}}`, String(v));
        });
      }
      return val;
    },
    [dict],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
    }),
    [locale, setLocale, t, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  return context ?? fallbackI18n;
}

export function useT() {
  return useI18n().t;
}
