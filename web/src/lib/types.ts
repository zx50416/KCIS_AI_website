export type Locale = "zh-TW" | "en";
export type Role = "teacher" | "student" | "admin";
export type Level = "kindergarten" | "elementary" | "middle" | "high" | "university";
export type Complexity = "simple" | "standard" | "advanced";

/** School office / unit for administrative staff */
export type Department =
  | "general_affairs"
  | "hr"
  | "it"
  | "academic_affairs"
  | "student_affairs"
  | "accounting"
  | "library"
  | "other_office";

export type LocalizedText = {
  "zh-TW": string;
  en: string;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  tasks: string[];
  roles: Array<"teacher" | "student" | "admin">;
  levels: Level[];
  languages: string[];
  freeStatus: "free" | "freemium" | "paid" | "unknown";
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  difficulty: string;
  shortDescription: LocalizedText;
  privacyNotes: LocalizedText[];
  strengths: LocalizedText[];
  officialUrl: string | null;
  educationUrl: string | null;
  status: "active" | "unknown" | "deprecated" | "needs_review";
  pageStatus: "placeholder" | "draft" | "complete";
  priorityCore?: boolean;
};

export type UserNeed = {
  role: Role | null;
  level: Level | null;
  department: Department | null;
  task: string | null;
  keywords: string[];
  freeOnly: boolean;
  note: string;
  locale: Locale;
};

export type RankedTool = {
  id: string;
  name: string;
  score: number;
  reasons: string[];
  difficultyStars: number;
  freeStatus: string;
  officialUrl: string | null;
  tool: Tool;
  pinnedCore?: boolean;
};

export type WizardStep =
  | "welcome"
  | "role"
  | "level"
  | "department"
  | "task"
  | "keywords"
  | "details"
  | "results";
