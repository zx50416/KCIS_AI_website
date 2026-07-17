"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "@/locales/en.json";
import zhTW from "@/locales/zh-TW.json";
import type { Locale } from "./types";

const dictionaries = {
  "zh-TW": zhTW,
  en,
} as const;

type Dictionary = typeof zhTW;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh-TW");

  const toggleLocale = useCallback(() => {
    setLocale((prev) => (prev === "zh-TW" ? "en" : "zh-TW"));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
      toggleLocale,
    }),
    [locale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function pickLocalized(
  value: { "zh-TW": string; en: string } | undefined,
  locale: Locale,
): string {
  if (!value) return "";
  return value[locale] || value["zh-TW"] || value.en || "";
}
