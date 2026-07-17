"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function SiteHeader({ onRestart }: { onRestart?: () => void }) {
  const { t, toggleLocale } = useI18n();

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label={t.meta.brand}>
        <Image
          src="/brand/kangchiao-logo.png"
          alt=""
          width={154}
          height={28}
          className="h-8 w-auto sm:h-9"
          priority
        />
      </Link>

      <div className="flex items-center gap-2">
        {onRestart ? (
          <button type="button" className="kc-btn-ghost hidden sm:inline-flex" onClick={onRestart}>
            {t.nav.restart}
          </button>
        ) : null}
        <button type="button" className="kc-btn-ghost" onClick={toggleLocale}>
          {t.nav.language}
        </button>
      </div>
    </header>
  );
}
