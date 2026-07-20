"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  ADMIN_DEPARTMENTS,
  getComplexity,
  keywordChips,
  levelsForRole,
  tasksForProfile,
} from "@/lib/adaptive";
import { useI18n } from "@/lib/i18n";
import { rankTools } from "@/lib/scoring";
import { getTools } from "@/lib/tools";
import type { Department, Role, UserNeed, WizardStep } from "@/lib/types";
import { DecorBackground } from "./DecorBackground";
import { OptionCard, StepPanel } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";
import { ResultsPanel } from "./ResultsPanel";
import { SiteHeader } from "./SiteHeader";

const initialNeed = (locale: UserNeed["locale"]): UserNeed => ({
  role: null,
  level: null,
  department: null,
  task: null,
  keywords: [],
  freeOnly: true,
  note: "",
  locale,
});

function progressSteps(role: Role | null): WizardStep[] {
  if (role === "admin") {
    return ["role", "department", "task", "keywords", "details"];
  }
  return ["role", "level", "task", "keywords", "details"];
}

export function NavigatorApp() {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<WizardStep>("welcome");
  const [need, setNeed] = useState<UserNeed>(() => initialNeed(locale));
  const tools = useMemo(() => getTools(), []);

  const needWithLocale: UserNeed = useMemo(
    () => ({ ...need, locale }),
    [need, locale],
  );

  const complexity = getComplexity(need.role, need.level);
  const steps = progressSteps(need.role);
  const progressTotal = steps.length;
  const progressIndex =
    step === "welcome" || step === "results"
      ? 0
      : Math.max(0, steps.indexOf(step));

  const taskIds = need.role
    ? tasksForProfile(need.role, complexity, need.department)
    : [];
  const levelIds = need.role ? levelsForRole(need.role) : [];

  const ranked = useMemo(
    () => rankTools(tools, needWithLocale, 6),
    [tools, needWithLocale],
  );

  function go(next: WizardStep) {
    setStep(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function restart() {
    setNeed(initialNeed(locale));
    go("welcome");
  }

  function toggleKeyword(k: string) {
    setNeed((prev) => {
      const exists = prev.keywords.includes(k);
      return {
        ...prev,
        keywords: exists ? prev.keywords.filter((x) => x !== k) : [...prev.keywords, k],
      };
    });
  }

  function backFromTask() {
    go(need.role === "admin" ? "department" : "level");
  }

  const canShowKeywords =
    Boolean(need.role && need.task) &&
    (need.role === "admin" ? Boolean(need.department) : Boolean(need.level));

  return (
    <div className="kc-shell">
      <DecorBackground />
      <SiteHeader onRestart={step === "welcome" ? undefined : restart} />

      {step !== "welcome" && step !== "results" ? (
        <ProgressBar stepIndex={progressIndex} total={progressTotal} />
      ) : null}

      <AnimatePresence mode="wait">
        {step === "welcome" ? (
          <motion.section
            key="welcome"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6"
          >
            <div className="kc-hero relative overflow-hidden rounded-[1.75rem] border border-kc-blue/10 shadow-soft">
              <div className="kc-hero-glow" aria-hidden />
              <span className="kc-sparkles" aria-hidden>
                <span className="kc-sparkle kc-sparkle-a">✦</span>
                <span className="kc-sparkle kc-sparkle-b">✧</span>
                <span className="kc-diamond">◇</span>
                <span className="kc-hero-orb kc-hero-orb-a" />
                <span className="kc-hero-orb kc-hero-orb-b" />
              </span>

              <div className="relative z-[1] flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-20">
                <h1 className="font-display max-w-xl text-[1.85rem] font-bold leading-tight tracking-tight text-kc-blue-deep sm:text-4xl sm:leading-tight">
                  {t.welcome.title}
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-kc-muted sm:text-base">
                  {t.welcome.subtitle}
                </p>
                <button
                  type="button"
                  className="kc-btn-hero mt-10"
                  onClick={() => go("role")}
                >
                  {t.welcome.cta}
                </button>
              </div>
            </div>
          </motion.section>
        ) : null}

        {step === "role" ? (
          <StepPanel key="role" title={t.steps.role}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["teacher", "student", "admin"] as Role[]).map((role) => (
                <OptionCard
                  key={role}
                  large
                  title={t.roles[role].label}
                  hint={t.roles[role].hint}
                  selected={need.role === role}
                  onClick={() => {
                    setNeed((p) => ({
                      ...p,
                      role,
                      level: null,
                      department: null,
                      task: null,
                      keywords: [],
                    }));
                    go(role === "admin" ? "department" : "level");
                  }}
                />
              ))}
            </div>
            <div className="mt-6">
              <button type="button" className="kc-btn-ghost" onClick={() => go("welcome")}>
                {t.nav.back}
              </button>
            </div>
          </StepPanel>
        ) : null}

        {step === "department" ? (
          <StepPanel
            key="department"
            title={t.steps.department}
            subtitle={t.complexityHints.standard}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ADMIN_DEPARTMENTS.map((dept: Department) => (
                <OptionCard
                  key={dept}
                  large={
                    dept === "general_affairs" || dept === "hr" || dept === "it"
                  }
                  title={t.departments[dept].label}
                  hint={t.departments[dept].hint}
                  selected={need.department === dept}
                  onClick={() => {
                    setNeed((p) => ({
                      ...p,
                      department: dept,
                      task: null,
                      keywords: [],
                    }));
                    go("task");
                  }}
                />
              ))}
            </div>
            <div className="mt-6">
              <button type="button" className="kc-btn-ghost" onClick={() => go("role")}>
                {t.nav.back}
              </button>
            </div>
          </StepPanel>
        ) : null}

        {step === "level" ? (
          <StepPanel
            key="level"
            title={t.steps.level}
            subtitle={
              need.role === "student" && !need.level
                ? t.complexityHints.standard
                : t.complexityHints[complexity]
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {levelIds.map((level) => (
                <OptionCard
                  key={level}
                  large={level === "elementary" || level === "kindergarten"}
                  title={t.levels[level].label}
                  hint={t.levels[level].hint}
                  selected={need.level === level}
                  onClick={() => {
                    setNeed((p) => ({ ...p, level, task: null, keywords: [] }));
                    go("task");
                  }}
                />
              ))}
            </div>
            <div className="mt-6">
              <button type="button" className="kc-btn-ghost" onClick={() => go("role")}>
                {t.nav.back}
              </button>
            </div>
          </StepPanel>
        ) : null}

        {step === "task" ? (
          <StepPanel
            key="task"
            title={t.steps.task}
            subtitle={t.complexityHints[complexity]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {taskIds.map((taskId) => (
                <OptionCard
                  key={taskId}
                  title={t.tasks[taskId as keyof typeof t.tasks] ?? taskId}
                  selected={need.task === taskId}
                  onClick={() => {
                    setNeed((p) => ({ ...p, task: taskId, keywords: [] }));
                    if (taskId === "other") {
                      go("details");
                    } else {
                      go("keywords");
                    }
                  }}
                />
              ))}
            </div>
            <div className="mt-6">
              <button type="button" className="kc-btn-ghost" onClick={backFromTask}>
                {t.nav.back}
              </button>
            </div>
          </StepPanel>
        ) : null}

        {step === "keywords" && canShowKeywords ? (
          <KeywordsStep
            key="keywords"
            need={needWithLocale}
            selected={need.keywords}
            onToggle={toggleKeyword}
            freeOnly={need.freeOnly}
            onFreeOnly={(v) => setNeed((p) => ({ ...p, freeOnly: v }))}
            onBack={() => go("task")}
            onNext={() => go("details")}
          />
        ) : null}

        {step === "details" ? (
          <StepPanel
            key="details"
            title={t.steps.details}
            subtitle={need.task === "other" ? t.nav.otherHint : t.meta.privacy}
          >
            <label className="block text-sm font-medium text-kc-ink" htmlFor="note">
              {need.task === "other" ? t.nav.otherHint : t.nav.optionalNote}
            </label>
            <textarea
              id="note"
              className="mt-2 min-h-32 w-full rounded-2xl border border-kc-blue/15 bg-white/90 p-3 text-sm outline-none ring-kc-purple/30 focus:ring-2"
              value={need.note}
              onChange={(e) => setNeed((p) => ({ ...p, note: e.target.value }))}
              placeholder={
                need.role === "admin"
                  ? locale === "zh-TW"
                    ? "例如：下週家長日停車動線公告、或採購投影機規格說明草稿"
                    : "e.g. parent day parking notice, or a projector purchase draft"
                  : need.task === "other"
                    ? locale === "zh-TW"
                      ? "例如：想做一首校園主題的短歌、或做一個班級網頁"
                      : "e.g. a short campus-themed song, or a class website"
                    : complexity === "simple"
                      ? locale === "zh-TW"
                        ? "例如：我想更懂分數加減"
                        : "e.g. I want to understand fractions better"
                      : locale === "zh-TW"
                        ? "例如：高二物理、需要含圖表說明"
                        : "e.g. Grade 11 physics with diagram explanations"
              }
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="kc-btn-ghost"
                onClick={() => go(need.task === "other" ? "task" : "keywords")}
              >
                {t.nav.back}
              </button>
              <button
                type="button"
                className="kc-btn-primary"
                disabled={need.task === "other" && !need.note.trim()}
                onClick={() => go("results")}
              >
                {t.nav.next}
              </button>
            </div>
          </StepPanel>
        ) : null}

        {step === "results" ? (
          <ResultsPanel
            key="results"
            need={needWithLocale}
            ranked={ranked}
            onBack={() => go("details")}
            onRestart={restart}
          />
        ) : null}
      </AnimatePresence>

      {t.footer ? (
        <footer className="mx-auto w-full max-w-5xl px-4 py-10 text-center text-xs text-kc-muted sm:px-6">
          {t.footer}
        </footer>
      ) : (
        <div className="py-8" />
      )}
    </div>
  );
}

function KeywordsStep({
  need,
  selected,
  onToggle,
  freeOnly,
  onFreeOnly,
  onBack,
  onNext,
}: {
  need: UserNeed;
  selected: string[];
  onToggle: (k: string) => void;
  freeOnly: boolean;
  onFreeOnly: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t, locale } = useI18n();
  const chips = useMemo(() => {
    if (!need.role || !need.task) return [];
    return keywordChips(need.role, need.level, need.task, locale, need.department);
  }, [need.role, need.level, need.task, need.department, locale]);

  return (
    <StepPanel title={t.steps.keywords} subtitle={t.complexityHints[getComplexity(need.role, need.level)]}>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip: string) => (
          <button
            key={chip}
            type="button"
            className={`kc-chip ${selected.includes(chip) ? "kc-chip-active" : ""}`}
            onClick={() => onToggle(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-kc-blue/10 bg-white/70 p-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-kc-purple"
          checked={freeOnly}
          onChange={(e) => onFreeOnly(e.target.checked)}
        />
        <span className="text-sm text-kc-ink">{t.nav.freeOnly}</span>
      </label>

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="kc-btn-ghost" onClick={onBack}>
          {t.nav.back}
        </button>
        <button type="button" className="kc-btn-primary" onClick={onNext}>
          {t.nav.next}
        </button>
      </div>
    </StepPanel>
  );
}
