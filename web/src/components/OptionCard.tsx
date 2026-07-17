"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

function SparkleDecor() {
  return (
    <span className="kc-sparkles" aria-hidden>
      <span className="kc-sparkle kc-sparkle-a">✦</span>
      <span className="kc-sparkle kc-sparkle-b">✧</span>
      <span className="kc-diamond">◇</span>
    </span>
  );
}

export function OptionCard({
  title,
  hint,
  selected,
  onClick,
  large = false,
}: {
  title: string;
  hint?: string;
  selected?: boolean;
  onClick: () => void;
  large?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.98 }}
      onClick={onClick}
      className={`kc-card kc-choice relative w-full overflow-hidden text-left transition ${
        selected ? "kc-card-selected" : "hover:border-kc-purple/30"
      } ${large ? "p-5 sm:p-6" : "p-4"}`}
    >
      <SparkleDecor />
      <span className={`relative z-[1] block font-semibold text-kc-ink ${large ? "text-lg sm:text-xl" : "text-base"}`}>
        {title}
      </span>
      {hint ? <span className="relative z-[1] mt-1 block text-sm text-kc-muted">{hint}</span> : null}
    </motion.button>
  );
}

export function StepPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      key={title}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6"
    >
      <h2 className="font-display text-2xl font-semibold tracking-tight text-kc-blue-deep sm:text-3xl">
        <span className="mr-2 inline-block text-kc-purple/70" aria-hidden>
          ✦
        </span>
        {title}
      </h2>
      {subtitle ? <p className="mt-2 max-w-reading text-sm text-kc-muted sm:text-base">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
