import type { RankedTool, Tool, UserNeed } from "./types";
import {
  isSpecializedCreativeTask,
  normalizeTaskForScoring,
} from "./adaptive";

const WEIGHTS = {
  task: 6,
  role: 2,
  level: 2,
  language: 1,
  free: 3,
  specialized: 8,
  generalistPenalty: 5,
};

/** Dedicated AI video tools — should rank above generalists for video tasks */
const VIDEO_SPECIALIST_IDS = new Set([
  "runway",
  "heygen",
  "pika",
  "luma",
  "vidnoz",
  "edpuzzle",
  "wevideo",
]);

const GENERALIST_IDS = new Set(["chatgpt", "gemini", "magicschool", "edcafe", "kuse", "copilot"]);

/** KC campus AI image tools from school spreadsheet */
const IMAGE_AI_IDS = new Set(["recraft", "myedit", "playground_ai", "canva", "pixton"]);

const CORE_TEACHING_TASKS = new Set([
  "lesson_plan",
  "worksheet",
  "quiz",
  "presentation",
  "research",
  "summary",
  "translate",
  "admin_draft",
  "tutoring",
  "fun_learn",
  "homework_help",
  "study_notes",
  "feedback",
]);

export function scoreTool(tool: Tool, need: UserNeed): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const rawTask = need.task;
  const task = normalizeTaskForScoring(rawTask);
  const creative = isSpecializedCreativeTask(rawTask);

  if (tool.status === "deprecated") {
    return { score: -10_000, reasons: ["excluded:deprecated"] };
  }

  if (need.freeOnly) {
    if (tool.freeStatus === "paid") {
      return { score: -10_000, reasons: ["excluded:not_free"] };
    }
    if (tool.freeStatus === "free" || tool.freeStatus === "freemium") {
      score += WEIGHTS.free;
      reasons.push("free_ok");
    } else if (tool.freeStatus === "unknown") {
      reasons.push("free_unknown");
    }
  }

  const taskHit =
    (task && tool.tasks.includes(task)) ||
    (rawTask && tool.tasks.includes(rawTask));

  if (taskHit) {
    score += WEIGHTS.task;
    reasons.push("task_match");
  } else if (creative && task) {
    // Specialized ask but tool has no matching task tag → strong demotion
    score -= 4;
  }

  if (need.role) {
    // Admin tools are not fully tagged yet — treat campus office staff like teachers for match.
    const roleOk =
      tool.roles.includes(need.role) ||
      (need.role === "admin" && tool.roles.includes("teacher"));
    if (roleOk) {
      score += WEIGHTS.role;
      reasons.push("role_match");
    }
  }

  if (need.role === "admin") {
    // Prefer document / presentation / research tools for office work
    const adminFriendly =
      tool.tasks.some((x) =>
        ["admin_draft", "presentation", "summary", "research", "translate", "writing", "image"].includes(
          x,
        ),
      ) ||
      tool.categories.includes("generative_text") ||
      tool.categories.includes("reading_research") ||
      GENERALIST_IDS.has(tool.id);
    if (adminFriendly) {
      score += 2;
      reasons.push("admin_office_fit");
    }
  } else if (need.level && tool.levels.includes(need.level)) {
    score += WEIGHTS.level;
    reasons.push("level_match");
  } else if (
    need.level === "kindergarten" &&
    tool.levels.includes("elementary")
  ) {
    // 幼兒園老師：沿用有國小標籤的工具
    score += WEIGHTS.level;
    reasons.push("level_match");
  }

  if (need.locale && tool.languages.includes(need.locale)) {
    score += WEIGHTS.language;
    reasons.push("language_match");
  }

  // Strong category boosts for distinctive needs
  if (rawTask === "music" || rawTask === "sound" || task === "music") {
    if (tool.categories.includes("media_music") || tool.id === "suno") {
      score += WEIGHTS.specialized;
      reasons.push("media_boost");
    }
  }
  if (rawTask === "video" || task === "video") {
    if (VIDEO_SPECIALIST_IDS.has(tool.id)) {
      score += WEIGHTS.specialized;
      reasons.push("video_boost");
    } else if (tool.categories.includes("media_video")) {
      score += WEIGHTS.specialized - 2;
      reasons.push("video_boost");
    } else if (tool.id === "canva") {
      score += WEIGHTS.specialized - 4;
      reasons.push("media_boost");
    } else if (tool.categories.includes("media_music") && tool.tasks.includes("video")) {
      score += WEIGHTS.specialized - 3;
      reasons.push("media_boost");
    }
  }
  if (rawTask === "image" || task === "image") {
    if (IMAGE_AI_IDS.has(tool.id)) {
      score += WEIGHTS.specialized;
      reasons.push("image_boost");
    } else if (tool.categories.includes("media_music")) {
      score += WEIGHTS.specialized - 2;
      reasons.push("media_boost");
    }
  }
  if (rawTask === "coding" || rawTask === "web_project" || task === "coding") {
    if (tool.categories.includes("devtools") || tool.id === "cursor" || tool.id === "codex" || tool.id === "claude_code") {
      score += WEIGHTS.specialized;
      reasons.push("devtools_boost");
    }
  }
  if (rawTask === "simulation" || task === "simulation") {
    if (tool.categories.includes("subject_specialized")) {
      score += WEIGHTS.specialized;
      reasons.push("specialized_boost");
    }
  }
  if (rawTask === "interest_explore" || task === "brainstorm") {
    if (
      tool.categories.includes("whiteboard_collab") ||
      tool.id === "padlet" ||
      tool.id === "freeform" ||
      tool.id === "canva"
    ) {
      score += WEIGHTS.specialized - 2;
      reasons.push("specialized_boost");
    }
  }
  if ((task === "research" || task === "summary") && tool.categories.includes("reading_research")) {
    score += 4;
    reasons.push("research_boost");
  }

  // Penalize general chatbots on creative/specialized tasks so Suno/Cursor/etc. surface
  if (creative && GENERALIST_IDS.has(tool.id)) {
    score -= WEIGHTS.generalistPenalty;
    reasons.push("generalist_downrank");
  }

  // "other": no task signal — prefer easier, broader tools lightly, still allow specialists if free/role fit
  if (rawTask === "other") {
    if (tool.difficultyStars <= 2) score += 1;
    if (GENERALIST_IDS.has(tool.id)) score += 1;
  }

  if (need.level === "elementary" && tool.difficultyStars <= 2) {
    score += 1;
  }
  if (need.level === "elementary" && tool.difficultyStars >= 4) {
    score -= 2;
  }

  return { score, reasons };
}

/** Core partner pins only for teaching-ish needs, not music/coding/etc. */
export function isCoreCapable(tool: Tool, need: UserNeed, reasons: string[]): boolean {
  if (!tool.priorityCore) return false;
  if (tool.status === "deprecated") return false;
  if (need.freeOnly && tool.freeStatus === "paid") return false;
  if (need.role) {
    const roleOk =
      tool.roles.includes(need.role) ||
      (need.role === "admin" && tool.roles.includes("teacher"));
    if (!roleOk) return false;
  }
  if (need.role !== "admin" && need.level && !tool.levels.includes(need.level)) {
    if (!(need.level === "kindergarten" && tool.levels.includes("elementary"))) {
      return false;
    }
  }
  if (isSpecializedCreativeTask(need.task)) return false;
  if (need.task === "other") return false;

  const task = normalizeTaskForScoring(need.task);
  const raw = need.task;
  if (raw && (tool.tasks.includes(raw) || (task && tool.tasks.includes(task)))) {
    return true;
  }
  if (reasons.includes("task_match") && task && CORE_TEACHING_TASKS.has(task)) {
    return true;
  }
  if (
    (need.role === "teacher" || need.role === "admin") &&
    task &&
    CORE_TEACHING_TASKS.has(task)
  ) {
    return tool.tasks.includes(task) || tool.tasks.includes(raw || "");
  }
  return false;
}

/** Whether scoring reasons show a real fit for the chosen task (not just role/level). */
export function isTaskRelevant(reasons: string[], rawTask: string | null): boolean {
  if (reasons.includes("task_match") || reasons.includes("core_partner")) return true;
  if (!rawTask || rawTask === "other") {
    return reasons.some((r) =>
      ["task_match", "core_partner", "admin_office_fit", "research_boost"].includes(r),
    );
  }

  const boostByTask: Record<string, string[]> = {
    video: ["video_boost", "media_boost"],
    image: ["image_boost", "media_boost"],
    music: ["media_boost"],
    sound: ["media_boost"],
    coding: ["devtools_boost"],
    web_project: ["devtools_boost"],
    simulation: ["specialized_boost"],
    interest_explore: ["specialized_boost"],
  };
  const boosts = boostByTask[rawTask] ?? [];
  return reasons.some((r) => boosts.includes(r));
}

export function markLowRelevance(items: RankedTool[], need: UserNeed): RankedTool[] {
  if (items.length === 0) return items;
  const topScore = items[0].score;

  return items.map((item) => {
    if (item.pinnedCore) return { ...item, lowRelevance: false };

    const taskFit = isTaskRelevant(item.reasons, need.task);
    const adminOk =
      need.role === "admin" &&
      item.reasons.includes("admin_office_fit") &&
      item.reasons.includes("task_match");

    const low =
      !taskFit &&
      !adminOk &&
      (need.task !== "other" || topScore - item.score >= 8);

    return { ...item, lowRelevance: low };
  });
}

export function rankTools(tools: Tool[], need: UserNeed, topK = 6): RankedTool[] {
  const ranked: RankedTool[] = [];
  for (const tool of tools) {
    const { score, reasons } = scoreTool(tool, need);
    if (score <= -10_000) continue;
    ranked.push({
      id: tool.id,
      name: tool.name,
      score,
      reasons,
      difficultyStars: tool.difficultyStars,
      freeStatus: tool.freeStatus,
      officialUrl: tool.officialUrl,
      tool,
      pinnedCore: false,
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const coreIdx = ranked.findIndex((r) => isCoreCapable(r.tool, need, r.reasons));
  if (coreIdx > 0) {
    const [core] = ranked.splice(coreIdx, 1);
    core.pinnedCore = true;
    if (!core.reasons.includes("core_partner")) {
      core.reasons = ["core_partner", ...core.reasons];
    }
    ranked.unshift(core);
  } else if (coreIdx === 0) {
    ranked[0].pinnedCore = true;
    if (!ranked[0].reasons.includes("core_partner")) {
      ranked[0].reasons = ["core_partner", ...ranked[0].reasons];
    }
  }

  return markLowRelevance(ranked.slice(0, topK), need);
}

export function difficultyLabel(stars: number, locale: "zh-TW" | "en"): string {
  if (locale === "zh-TW") {
    if (stars <= 1) return "很好學，幾乎一看就會";
    if (stars === 2) return "好學，稍看一下就會";
    if (stars === 3) return "普通，要花一點時間熟悉";
    if (stars === 4) return "要學一下，有學習曲線";
    return "比較進階，建議有人帶";
  }
  if (stars <= 1) return "Very easy to learn";
  if (stars === 2) return "Easy to pick up";
  if (stars === 3) return "Takes a little practice";
  if (stars === 4) return "Steeper learning curve";
  return "Advanced — better with guidance";
}

export function formatStars(stars: number): string {
  const n = Math.min(5, Math.max(1, Math.round(stars)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}
