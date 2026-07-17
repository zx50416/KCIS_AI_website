import type { Department, Level, Locale, Role, UserNeed } from "./types";
import { getComplexity } from "./adaptive";

function levelLabel(level: Level, locale: Locale): string {
  const map: Record<Level, { "zh-TW": string; en: string }> = {
    kindergarten: { "zh-TW": "幼兒園", en: "kindergarten" },
    elementary: { "zh-TW": "國小", en: "elementary school" },
    middle: { "zh-TW": "國中", en: "middle school" },
    high: { "zh-TW": "高中", en: "high school" },
    university: { "zh-TW": "大學", en: "university" },
  };
  return map[level][locale];
}

function roleLabel(role: Role, locale: Locale): string {
  if (locale === "zh-TW") {
    if (role === "teacher") return "教師";
    if (role === "admin") return "行政人員";
    return "學生";
  }
  if (role === "teacher") return "teacher";
  if (role === "admin") return "administrative staff";
  return "student";
}

function departmentLabel(dept: Department, locale: Locale): string {
  const map: Record<Department, { "zh-TW": string; en: string }> = {
    general_affairs: { "zh-TW": "總務處", en: "General Affairs" },
    hr: { "zh-TW": "人事處／人資", en: "HR" },
    it: { "zh-TW": "資訊處", en: "IT" },
    academic_affairs: { "zh-TW": "教務處", en: "Academic Affairs" },
    student_affairs: { "zh-TW": "學務處", en: "Student Affairs" },
    accounting: { "zh-TW": "會計／出納", en: "Accounting" },
    library: { "zh-TW": "圖書館", en: "Library" },
    other_office: { "zh-TW": "其他行政單位", en: "Other office" },
  };
  return map[dept][locale];
}

function buildAdminPrompt(need: UserNeed, hint?: string): string {
  const locale = need.locale;
  const dept = need.department
    ? departmentLabel(need.department, locale)
    : locale === "zh-TW"
      ? "行政單位"
      : "an administrative office";
  const keywords = need.keywords.length
    ? need.keywords.join(locale === "zh-TW" ? "、" : ", ")
    : "";
  const note = [hint, need.note].filter(Boolean).join(locale === "zh-TW" ? "；" : "; ");
  const task = need.task ?? (locale === "zh-TW" ? "行政文書" : "admin writing");

  if (locale === "zh-TW") {
    return [
      "你是校園行政文書助理，熟悉台灣中小學行政溝通語氣。",
      `使用者身分：行政人員（${dept}）。`,
      `任務：${task}。`,
      note ? `需求說明：${note}` : "",
      keywords ? `請務必做到：${keywords}。` : "",
      "請先給可直接複製的草稿，再用條列標註『需人工確認』的地方。",
      "用語正式、清楚、精簡；避免網路口語。",
      "嚴禁輸出真實姓名、身分證字號、薪資、個資或未公開校務機密。",
      "若涉及法規、採購金額或人事規定，請標示『請以校內正式規定為準』，不要假裝已核准。",
      "預設輸出繁體中文。",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "You are a school administrative writing assistant.",
    `User role: administrative staff (${dept}).`,
    `Task: ${task}.`,
    note ? `Request: ${note}` : "",
    keywords ? `Must include: ${keywords}.` : "",
    "Provide a copy-ready draft, then bullet items that need human review.",
    "Tone: formal, clear, concise.",
    "Never output real names, ID numbers, salaries, or confidential school data.",
    "For policy, procurement, or HR rules, mark 'verify against official school policy' — do not invent approvals.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPrompt(need: UserNeed, hint?: string): string {
  const locale = need.locale;
  const role = need.role ?? "student";

  if (role === "admin") {
    return buildAdminPrompt(need, hint);
  }

  const level = need.level ?? "middle";
  const complexity = getComplexity(role, level);
  const keywords = need.keywords.length ? need.keywords.join("、") : "";
  const note = [hint, need.note].filter(Boolean).join("；");

  if (locale === "zh-TW") {
    if (role === "student" && level === "elementary") {
      const want = need.task
        ? `我想做的事是：${need.task}（請用適合國小的方式幫忙）。`
        : "我想把事情弄懂。";
      return [
        "請用國小聽得懂的話跟我說話。",
        "我是國小學生。",
        want,
        note ? `我還想說：${note}` : "請用短句子。",
        keywords ? `請做到：${keywords}。` : "",
        "請一步一步說，一次不要說太多。",
        "如果要出題，先只要很少題。",
        "不要問我真實姓名或成績。",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (complexity === "advanced") {
      return [
        `你是協助${levelLabel(level, locale)}${roleLabel(role, locale)}的專業教學／學習助手。`,
        `任務類型：${need.task ?? "一般學習支援"}。`,
        note ? `需求說明：${note}` : "",
        keywords ? `約束條件：${keywords}` : "",
        "請先給結構化大綱，再產出完整內容。",
        "標明假設、限制與可驗證的下一步。",
        "避免捏造來源；需要引用時請標示「待查證」。",
        "嚴禁處理真實姓名、成績或其他個資。",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [
      `你是一位服務於${levelLabel(level, locale)}的AI助理，使用者身分是${roleLabel(role, locale)}。`,
      `主要任務：${need.task ?? "學習／教學支援"}。`,
      note ? `補充需求：${note}` : "",
      keywords ? `請納入：${keywords}。` : "",
      "請用清楚結構產出，並附上簡短使用說明。",
      "內容需符合學段難度，避免不適合的素材。",
      "請勿要求或生成真實個人資料。",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (role === "student" && level === "elementary") {
    return [
      "Please talk to me with easy words a child can understand.",
      "I am an elementary student.",
      need.task ? `I want help with: ${need.task}.` : "I want to understand better.",
      note ? `Also: ${note}` : "Use short sentences.",
      keywords ? `Please include: ${keywords}.` : "",
      "Go step by step. Do not say too much at once.",
      "If you give practice questions, only a few.",
      "Do not ask for real names or grades.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (complexity === "advanced") {
    return [
      `You are a professional assistant for a ${levelLabel(level, locale)} ${roleLabel(role, locale)}.`,
      `Task type: ${need.task ?? "general academic support"}.`,
      note ? `Request: ${note}` : "",
      keywords ? `Constraints: ${keywords}` : "",
      "Start with a structured outline, then full content.",
      "State assumptions, limits, and verifiable next steps.",
      "Do not invent sources; mark uncertain claims as unverified.",
      "Never process real names, grades, or other personal data.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `You are an AI assistant for ${levelLabel(level, locale)}, helping a ${roleLabel(role, locale)}.`,
    `Main task: ${need.task ?? "learning/teaching support"}.`,
    note ? `Extra needs: ${note}` : "",
    keywords ? `Please include: ${keywords}.` : "",
    "Use a clear structure and a short how-to.",
    "Match the difficulty to this education stage.",
    "Do not request or generate real personal data.",
  ]
    .filter(Boolean)
    .join("\n");
}
