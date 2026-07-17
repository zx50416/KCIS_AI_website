"use client";

import { useI18n } from "@/lib/i18n";

export function ProgressBar({ stepIndex, total }: { stepIndex: number; total: number }) {
  const { t, locale } = useI18n();
  const pct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="mb-2 flex items-center justify-between text-xs text-kc-muted">
        <span>
          {locale === "zh-TW" ? `步驟 ${stepIndex + 1} / ${total}` : `Step ${stepIndex + 1} / ${total}`}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="kc-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="kc-progress-bar transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="sr-only">{t.meta.tagline}</p>
    </div>
  );
}
