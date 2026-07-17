"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { keywordChips } from "@/lib/adaptive";
import { pickLocalized, useI18n } from "@/lib/i18n";
import { buildPrompt } from "@/lib/prompts";
import { difficultyLabel, formatStars } from "@/lib/scoring";
import type { RankedTool, UserNeed } from "@/lib/types";

export function ResultsPanel({
  need,
  ranked,
  onBack,
  onRestart,
}: {
  need: UserNeed;
  ranked: RankedTool[];
  onBack: () => void;
  onRestart: () => void;
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [activeHint, setActiveHint] = useState<string>("");
  const [promptText, setPromptText] = useState("");
  const [copied, setCopied] = useState(false);

  const chips = useMemo(() => {
    if (!need.role || !need.task) return [];
    if (need.role !== "admin" && !need.level) return [];
    if (need.role === "admin" && !need.department) return [];
    return keywordChips(need.role, need.level, need.task, locale, need.department);
  }, [need.role, need.level, need.department, need.task, locale]);

  const summaryBits = [
    need.role ? t.roles[need.role].label : "",
    need.department ? t.departments[need.department].label : "",
    need.level ? t.levels[need.level].label : "",
    need.task ? t.tasks[need.task as keyof typeof t.tasks] ?? need.task : "",
    need.freeOnly ? t.nav.freeOnly : "",
  ].filter(Boolean);

  function refreshPrompt() {
    setPromptText(buildPrompt(need, activeHint));
  }

  async function copyPrompt() {
    const text = promptText || buildPrompt(need, activeHint);
    if (!promptText) setPromptText(text);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-kc-blue-deep sm:text-3xl">
            <span className="mr-2 text-kc-purple/80" aria-hidden>
              ✦
            </span>
            {t.nav.resultsTitle}
          </h2>
          <p className="mt-1 text-sm text-kc-muted">{t.prompt.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="kc-btn-ghost" onClick={onBack}>
            {t.nav.back}
          </button>
          <button type="button" className="kc-btn-ghost" onClick={onRestart}>
            {t.nav.restart}
          </button>
        </div>
      </div>

      <div className="kc-card mt-5 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-kc-purple">{t.nav.summaryTitle}</h3>
        <p className="mt-2 text-sm text-kc-ink sm:text-base">{summaryBits.join(" · ")}</p>
        {need.note ? <p className="mt-2 text-sm text-kc-muted">{need.note}</p> : null}
        <p className="mt-3 text-xs text-kc-muted">{t.meta.privacy}</p>
      </div>

      <p className="mt-4 text-xs text-kc-muted">{t.nav.starsHint}</p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {ranked.map((item, index) => (
          <motion.article
            key={item.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : index * 0.08 }}
            className={`kc-card kc-choice relative flex flex-col overflow-hidden p-4 sm:p-5 ${
              item.pinnedCore ? "kc-core-card" : ""
            }`}
          >
            <span className="kc-sparkles" aria-hidden>
              <span className="kc-sparkle kc-sparkle-a">✦</span>
              <span className="kc-diamond">◇</span>
            </span>
            <div className="relative z-[1] flex items-start justify-between gap-2">
              <div>
                {item.pinnedCore ? (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-kc-blue to-kc-purple px-2 py-0.5 text-[11px] font-semibold text-white">
                    ✦ {t.nav.coreBadge}
                  </span>
                ) : null}
                <h3 className="font-display text-xl font-semibold text-kc-blue-deep">{item.name}</h3>
              </div>
            </div>

            <div className="relative z-[1] mt-3 rounded-xl bg-kc-mist/90 px-3 py-2">
              <p className="text-xs font-medium text-kc-purple">{t.nav.difficulty}</p>
              <p className="mt-0.5 text-base tracking-wide text-kc-blue-deep" aria-label={`${item.difficultyStars} ${t.nav.stars}`}>
                {formatStars(item.difficultyStars)}
              </p>
              <p className="text-sm text-kc-ink">
                {difficultyLabel(item.difficultyStars, locale)}
                <span className="text-kc-muted"> · {item.difficultyStars}/5</span>
              </p>
            </div>

            <p className="relative z-[1] mt-2 text-sm text-kc-muted">
              {pickLocalized(item.tool.shortDescription, locale)}
            </p>
            <div className="relative z-[1] mt-3">
              <p className="text-xs font-semibold text-kc-purple">{t.nav.why}</p>
              <ul className="mt-1 space-y-1 text-sm text-kc-ink">
                {item.reasons
                  .filter((r) => !r.startsWith("excluded") && r !== "generalist_downrank")
                  .slice(0, 4)
                  .map((code) => (
                    <li key={code}>
                      · {t.reasonCodes[code as keyof typeof t.reasonCodes] ?? code}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="relative z-[1] mt-auto flex flex-wrap gap-2 pt-4">
              {item.officialUrl ? (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="kc-btn-primary"
                >
                  {t.nav.openOfficial}
                </a>
              ) : (
                <span className="text-sm text-kc-muted">
                  {locale === "zh-TW" ? "官方網址待確認" : "Official URL pending"}
                </span>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {ranked.length === 0 ? (
        <p className="mt-6 text-sm text-kc-muted">
          {locale === "zh-TW"
            ? "目前沒有符合的工具，請回上一步放寬一點條件。"
            : "No tools matched. Go back and relax the filters."}
        </p>
      ) : null}

      <div className="kc-card kc-choice relative mt-8 overflow-hidden p-4 sm:p-6">
        <span className="kc-sparkles" aria-hidden>
          <span className="kc-sparkle kc-sparkle-b">✧</span>
        </span>
        <h3 className="relative z-[1] font-display text-xl font-semibold text-kc-blue-deep">
          {t.prompt.title}
        </h3>
        <p className="relative z-[1] mt-1 text-sm text-kc-muted">{t.nav.promptHints}</p>

        <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = activeHint === chip;
            return (
              <button
                key={chip}
                type="button"
                className={`kc-chip ${active ? "kc-chip-active" : ""}`}
                onClick={() => {
                  setActiveHint(chip);
                  setPromptText(buildPrompt(need, chip));
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <textarea
          className="relative z-[1] mt-4 min-h-40 w-full rounded-2xl border border-kc-blue/15 bg-white/90 p-3 text-sm leading-relaxed text-kc-ink outline-none ring-kc-purple/30 focus:ring-2"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={buildPrompt(need)}
        />

        <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
          <button type="button" className="kc-btn-primary" onClick={refreshPrompt}>
            {t.nav.generatePrompt}
          </button>
          <button type="button" className="kc-btn-ghost" onClick={copyPrompt}>
            {copied ? t.nav.copied : t.nav.copy}
          </button>
          <a
            href="https://gemini.google.com/"
            target="_blank"
            rel="noreferrer"
            className="kc-btn-ghost"
          >
            {t.prompt.openGemini}
          </a>
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noreferrer"
            className="kc-btn-ghost"
          >
            {t.prompt.openChatGPT}
          </a>
          <a
            href="https://kuse.knsh.com.tw/"
            target="_blank"
            rel="noreferrer"
            className="kc-btn-ghost"
          >
            打開 Kuse
          </a>
        </div>
      </div>
    </motion.section>
  );
}
