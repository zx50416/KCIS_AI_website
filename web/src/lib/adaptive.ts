import type { Complexity, Department, Level, Role } from "./types";

/**
 * Simple wording ONLY for 學生 + 國小.
 */
export function getComplexity(role: Role | null, level: Level | null): Complexity {
  if (role === "student" && level === "elementary") return "simple";
  if (role === "admin") return "standard";
  if (level === "university") return "advanced";
  return "standard";
}

export function levelsForRole(role: Role): Level[] {
  if (role === "teacher") {
    return ["kindergarten", "elementary", "middle", "high"];
  }
  if (role === "admin") {
    return [];
  }
  return ["elementary", "middle", "high", "university"];
}

export const ADMIN_DEPARTMENTS: Department[] = [
  "general_affairs",
  "hr",
  "it",
  "academic_affairs",
  "student_affairs",
  "accounting",
  "library",
  "other_office",
];

/** Admin tasks shared + department-leaning options */
export function tasksForAdmin(department: Department | null): string[] {
  const common = [
    "admin_draft",
    "notice",
    "meeting_minutes",
    "form_template",
    "data_report",
    "presentation",
    "poster",
    "translate",
    "image",
    "collaboration",
    "other",
  ];

  const byDept: Record<Department, string[]> = {
    general_affairs: [
      "procurement",
      "facility",
      "schedule",
      "notice",
      "admin_draft",
      "poster",
      "form_template",
      "data_report",
      "presentation",
      "image",
      "other",
    ],
    hr: [
      "admin_draft",
      "notice",
      "form_template",
      "meeting_minutes",
      "onboarding_guide",
      "policy_summary",
      "data_report",
      "presentation",
      "translate",
      "other",
    ],
    it: [
      "it_sop",
      "account_faq",
      "web_project",
      "coding",
      "admin_draft",
      "notice",
      "presentation",
      "data_report",
      "image",
      "video",
      "other",
    ],
    academic_affairs: [
      "admin_draft",
      "notice",
      "schedule",
      "form_template",
      "data_report",
      "presentation",
      "meeting_minutes",
      "translate",
      "poster",
      "other",
    ],
    student_affairs: [
      "notice",
      "admin_draft",
      "parent_comm",
      "poster",
      "form_template",
      "schedule",
      "presentation",
      "image",
      "meeting_minutes",
      "other",
    ],
    accounting: [
      "admin_draft",
      "form_template",
      "data_report",
      "notice",
      "policy_summary",
      "presentation",
      "meeting_minutes",
      "other",
    ],
    library: [
      "notice",
      "poster",
      "admin_draft",
      "reading",
      "presentation",
      "image",
      "schedule",
      "form_template",
      "other",
    ],
    other_office: common,
  };

  return department ? byDept[department] : common;
}

export function tasksForProfile(
  role: Role,
  complexity: Complexity,
  department: Department | null = null,
): string[] {
  if (role === "admin") {
    return tasksForAdmin(department);
  }

  const creativeCore = [
    "music",
    "sound",
    "video",
    "image",
    "coding",
    "web_project",
    "interest_explore",
    "presentation",
    "poster",
  ];

  if (role === "student") {
    if (complexity === "simple") {
      return [
        "interest_explore",
        "music",
        "image",
        "video",
        "poster",
        "fun_learn",
        "presentation",
        "language_practice",
        "homework_help",
        "other",
      ];
    }
    return [
      ...creativeCore,
      "coding",
      "web_project",
      "portfolio",
      "collaboration",
      "writing",
      "study_notes",
      "research",
      "other",
    ];
  }

  // teacher
  return [
    "music",
    "sound",
    "video",
    "image",
    "coding",
    "web_project",
    "interest_explore",
    "simulation",
    "lesson_plan",
    "worksheet",
    "quiz",
    "presentation",
    "collaboration",
    "feedback",
    "translate",
    "research",
    "admin_draft",
    "other",
  ];
}

export function normalizeTaskForScoring(task: string | null): string | null {
  if (!task || task === "other") return null;
  const map: Record<string, string> = {
    homework_help: "tutoring",
    study_notes: "summary",
    fun_learn: "tutoring",
    sound: "music",
    web_project: "coding",
    interest_explore: "brainstorm",
    notice: "admin_draft",
    meeting_minutes: "admin_draft",
    form_template: "admin_draft",
    data_report: "research",
    procurement: "admin_draft",
    facility: "admin_draft",
    schedule: "admin_draft",
    parent_comm: "admin_draft",
    it_sop: "admin_draft",
    account_faq: "tutoring",
    onboarding_guide: "admin_draft",
    policy_summary: "summary",
  };
  return map[task] ?? task;
}

export function isSpecializedCreativeTask(task: string | null): boolean {
  if (!task) return false;
  return [
    "music",
    "sound",
    "video",
    "image",
    "coding",
    "web_project",
    "simulation",
    "interest_explore",
    "portfolio",
  ].includes(task);
}

export function keywordChips(
  role: Role,
  level: Level | null,
  task: string,
  locale: "zh-TW" | "en",
  department: Department | null = null,
): string[] {
  const zh = locale === "zh-TW";
  const kidMode = role === "student" && level === "elementary";

  if (role === "admin") {
    return adminKeywordChips(task, department, zh);
  }

  if (task === "music" || task === "sound") {
    return zh
      ? ["適合當背景音樂", "情緒要開心／平靜", "長度不要太長", "注意能不能免費使用", "給影片／簡報用"]
      : ["Good as background music", "Cheerful or calm mood", "Keep it short", "Check free use", "For video / slides"];
  }
  if (task === "coding" || task === "web_project") {
    return zh
      ? ["從零開始帶我做", "先給步驟再給程式", "適合學校專題", "解釋每一段在做什麼", "出錯時教我怎麼改"]
      : ["Guide me from zero", "Steps before code", "School project friendly", "Explain each part", "Help me fix errors"];
  }
  if (task === "video" || task === "image") {
    return zh
      ? ["風格清楚好懂", "適合課堂分享", "不要太複雜", "可以當封面／海報", "快速出一版就好"]
      : ["Clear simple style", "OK for class sharing", "Not too complex", "Works as cover/poster", "One quick draft"];
  }
  if (task === "interest_explore") {
    return zh
      ? ["介紹有趣的方向", "給我可以試的小專案", "適合這個年紀", "不要一次講太多", "引起好奇心"]
      : ["Interesting directions", "A small project to try", "Age-appropriate", "Not too much at once", "Spark curiosity"];
  }

  if (kidMode) {
    return zh
      ? ["講簡單一點", "舉一個例子", "一步一步來", "只要幾題練習", "不要寫太長", "幫我畫重點"]
      : ["Use easy words", "One example", "Step by step", "Only a few questions", "Keep it short", "Mark key points"];
  }

  if (role === "teacher") {
    const base = zh
      ? [
          "適合一節課用完",
          "簡單／普通／進階各一版",
          "可以直接發給學生",
          "附上參考答案",
          "難度符合這個年級",
          "不要出現真實姓名或成績",
        ]
      : [
          "Fits one class period",
          "Easy / normal / challenge versions",
          "Ready to give students",
          "Include answer key",
          "Right for this grade",
          "No real names or grades",
        ];
    if (task === "quiz" || task === "worksheet") {
      return zh
        ? [...base, "只要 5～8 題", "選擇＋簡答都有"]
        : [...base, "About 5–8 items", "Mix of MCQ and short answer"];
    }
    if (task === "lesson_plan") {
      return zh
        ? [...base, "有上課步驟", "列出要準備的東西"]
        : [...base, "Include teaching steps", "List what to prepare"];
    }
    return base;
  }

  return zh
    ? ["先給大綱再寫", "用條列呈現", "適合口頭報告", "提醒用自己的話寫", "不要太長", "標出容易錯的地方"]
    : ["Outline then details", "Use bullets", "Good for oral report", "Remind me to use my own words", "Keep it short", "Flag common mistakes"];
}

function adminKeywordChips(
  task: string,
  department: Department | null,
  zh: boolean,
): string[] {
  const privacy = zh
    ? ["不要出現真實姓名／個資", "用語正式但好懂", "可直接貼進公文草稿再人工審"]
    : ["No real names / personal data", "Formal but clear tone", "Draft only — human review before send"];

  const deptExtra: Partial<Record<Department, string[]>> = zh
    ? {
        general_affairs: ["列出採購／場地檢查清單", "標註負責窗口與時程"],
        hr: ["條列任用／請假注意事項", "避免敏感人事細節"],
        it: ["步驟可給不熟電腦的同仁", "含常見錯誤排除"],
        academic_affairs: ["對齊學期行事曆", "給導師／家長版本可分開"],
        student_affairs: ["語氣關懷但不越權", "活動資訊清楚"],
        accounting: ["數字用表格呈現", "註明需會計覆核"],
        library: ["適合張貼／網站公告", "活動時間地點清楚"],
        other_office: ["先給大綱再細節", "標註待確認項目"],
      }
    : {
        general_affairs: ["Include checklist and owners", "Note timeline and contact"],
        hr: ["Bullet key HR notes", "Avoid sensitive details"],
        it: ["Steps for non-tech staff", "Include common troubleshooting"],
        academic_affairs: ["Align to school calendar", "Teacher vs parent versions"],
        student_affairs: ["Caring but professional tone", "Clear event logistics"],
        accounting: ["Use tables for numbers", "Mark items needing finance review"],
        library: ["Poster / web announcement ready", "Clear time and place"],
        other_office: ["Outline first", "Flag items to confirm"],
      };

  const taskExtra = zh
    ? ({
        notice: ["標題＋對象＋日期＋聯絡方式", "一段話說完重點"],
        meeting_minutes: ["決議／待辦／負責人／期限", "條列清楚"],
        form_template: ["欄位名稱白話", "附填寫範例"],
        data_report: ["先給結論再給細節", "可用表格"],
        procurement: ["規格／數量／用途／時程", "提醒比價注意"],
        facility: ["檢查項目＋異常回報方式", "安全優先"],
        it_sop: ["一步一步截圖式說明", "最後放 FAQ"],
        account_faq: ["問答格式", "常見 5～8 題"],
        parent_comm: ["禮貌、簡短、可讀", "避免專業黑話"],
        policy_summary: ["重點摘要＋原文待查", "不自行解釋法規效力"],
        onboarding_guide: ["第一週必做清單", "誰可以問問題"],
        schedule: ["時間軸清楚", "標註衝突風險"],
      } as Record<string, string[]>)
    : ({
        notice: ["Title, audience, date, contact", "One clear paragraph"],
        meeting_minutes: ["Decisions / actions / owners / due dates", "Clear bullets"],
        form_template: ["Plain field labels", "Include an example"],
        data_report: ["Conclusion first", "Use a table"],
        procurement: ["Spec / qty / purpose / timeline", "Note comparison tips"],
        facility: ["Checklist + how to report issues", "Safety first"],
        it_sop: ["Step-by-step for beginners", "End with FAQ"],
        account_faq: ["Q&A format", "About 5–8 common questions"],
        parent_comm: ["Polite, short, readable", "Avoid jargon"],
        policy_summary: ["Key points + verify against source", "Do not invent legal force"],
        onboarding_guide: ["Week-1 checklist", "Who to ask"],
        schedule: ["Clear timeline", "Flag conflicts"],
      } as Record<string, string[]>);

  const base = zh
    ? ["繁體中文輸出", "結構清楚可複製", "標註『草稿，請人工確認』", ...privacy]
    : ["Output in clear English", "Copy-ready structure", "Mark as draft for human review", ...privacy];

  const extras = [
    ...(department ? deptExtra[department] ?? [] : []),
    ...(taskExtra[task] ?? []),
  ];

  return [...base, ...extras].slice(0, 8);
}
