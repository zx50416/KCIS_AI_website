# 康橋 AI 應用導航 — Agent 技術設計與實作紀錄

> 本文件由 Agent 持續追加，記錄資料蒐集、推薦邏輯與網站製作決策。  
> **公開倉庫僅保留本技術文件**；使用者既有規格 md 不納入版本庫。  
> 狀態：可對外分享的 Internal Prototype（前端 + 白名單推薦）

---

## 摘要：資料來源 · 生成邏輯 · 製作方法

### 資料來源（Data sources）

| 來源 | 用途 | 備註 |
|---|---|---|
| 人工策展白名單 `data/curated/tools.json`（同步至 `web/src/data/tools.json`） | 產品唯一推薦池 | 約 28 支工具；含官方 URL、任務／角色／學段標籤、難度星等 |
| 各工具**官方網站**（allowlist 限速爬取） | Layer A 事實摘要 | 寫入 `data/raw/`、`data/processed/`；原始快取不上傳 |
| 康軒 × Kuse 官方站 | 核心合作工具置頂規則 | https://kuse.knsh.com.tw/ |
| 康橋國際學校官網 Logo | 品牌識別 | `web/public/brand/kangchiao-logo.png` |
| 合成排序樣本 `data/training/*.jsonl` | 未來可訓練 ranking 雛形 | 規則／模板生成，非真實學生個資 |

**不做／延後**：Reddit 等社群大量爬取；未審核的第三方鏡像 URL；真實姓名／成績等個資。

### 生成邏輯（How recommendations & prompts are made）

1. **引導式問卷**（非一次填完）：身分（老師／學生／行政）→ 學段或處室 → 任務 → 關鍵詞 → 補充說明。  
2. **Tag scoring（規則打分）**：任務／角色／學段／語言／免費方案加權；音樂／程式等專項任務加分專精工具，並對 ChatGPT／Gemini／Kuse 等通用對話工具降權。  
3. **硬規則**：免費篩選可排除付費；deprecated 排除；行政人員暫以「教師可用工具」對齊，並偏好文書／簡報類。  
4. **核心置頂**：僅教學／文書向任務可置頂康軒 × Kuse；音樂／程式／創作專項不置頂。  
5. **提示詞模板**：依身分組裝可複製 prompt（國小學生用白話；行政用正式文書＋「草稿須人工確認」）。  
6. **第一版不依賴 LLM API** 做推薦；LLM 僅作為使用者貼上 prompt 後的外部工具。

### 製作方法（How the site was built）

```text
製作流程
1. 資料層（Python）
   ├── seed／策展 tools.json
   ├── 官方 allowlist 爬蟲 → Layer A facts
   └── 合成 ranking 樣本（可選）
2. 網站層（Next.js 15 + TypeScript + Tailwind + Motion）
   ├── 讀取 tools.json，前端打分 rankTools()
   ├── 雙語 zh-TW / en
   └── 靜態／SSR 皆可；部署以 web/ 為根目錄
3. 部署
   ├── 程式碼推至 GitHub
   └── Vercel（或同等）連線該 repo，Root Directory = web
```

本機開發：`cd web && npm install && npm run dev`（通常 http://127.0.0.1:3000）。

---

## 0. 文件使用方式

- 每個實作步驟結束後，在本文件**追加**一節（保留歷史，不刪改舊結論除非明確更正）。
- 目標讀者：未來的 Cursor／Codex Agent、以及使用者本人。
- 成功標準（資料階段）：有可版本化的白名單、可重跑的爬蟲、可追蹤來源的事實層、可擴充的推薦／訓練資料雛形。

---

## 1. 步驟 2026-07-17-A：範圍重述與刻意調整

### 1.1 使用者本輪指示摘要

- 先完成**資料蒐集與建立**（可自建、可爬取、可並行）。
- 可建立 `src`、`venv`、`data` 等目錄；**不要改動既有 md**。
- 每一個步驟寫進**單一、會變很長的技術設計 md**（即本文件）。
- 第一版要**工整、可交付**；LLM 訓練規模要符合 Mac M4 Pro 可實現。
- 規格可適當調整，不必讀死。

### 1.2 對規格的刻意調整（為了可交付）

| 規格原文傾向 | 本階段調整 | 理由 |
|---|---|---|
| Layer B 2,000–5,000 社群證據 | **延後**；先做小量官方摘要 | 社群條款複雜；先保證白名單可用 |
| Layer C 6,000–12,000 筆 | **第一輪目標 800–1,200 筆 synthetic**，結構可擴到 6k+ | M4 Pro 可訓練；先驗證 pipeline |
| 大規模多 domain 爬蟲 | **官方 allowlist 有限爬取** + 人工／規則補欄位 | 避免違規與幻覺 URL |
| Reddit | **排除**（維持規格） | API／訓練條款限制 |
| 網站 UI／Cloudflare | **本階段不做** | 先鎖資料契約 |
| 難易度 enum easy/medium/advanced | **改為 1–5 星**（另保留映射） | 符合 `ai工具label參考.md` |

### 1.3 本階段交付物定義（Definition of Done）

1. 目錄：`src/`、`data/`、`.venv/`、`scripts/`、`requirements.txt`
2. 白名單 `data/curated/tools.json`（全部參考工具，去重）
3. 爬蟲可對 allowlist 官方頁做限速抓取，寫入 `data/raw/` 與 `data/processed/`
4. Layer A 事實檔 `tool_facts.jsonl`（可少但可追蹤）
5. 小規模 ranking 訓練雛形 `data/training/*.jsonl`
6. 本技術文件持續更新

### 1.4 建議的長期資料規模（務實版）

```text
v1 資料（本週可完成）
├── tools: ~26–30
├── Layer A facts: ~300–600
├── Layer B evidence: 0–200（僅官方／允許 API）
└── Layer C ranking: 800–1,200 synthetic → 之後擴到 6k–12k

v1.5 模型（本機）
├── 1B–1.5B + LoRA/QLoRA
├── short context 512–1024
└── 只有贏過 tag-scoring baseline 才進產品
```

---

## 2. 步驟 2026-07-17-B：目錄與環境規劃

預計建立：

```text
應用導航網站_20260717/
├── AGENT_TECHNICAL_DESIGN_LOG.md    ← 本文件
├── requirements.txt
├── .gitignore
├── .venv/                           ← 專案虛擬環境（不提交）
├── src/
│   └── kangchiao_data/
│       ├── __init__.py
│       ├── schema.py
│       ├── seed_tools.py
│       ├── scoring.py
│       ├── crawl/
│       │   ├── __init__.py
│       │   ├── allowlist.py
│       │   ├── fetch.py
│       │   └── extract.py
│       ├── process/
│       │   ├── __init__.py
│       │   └── build_facts.py
│       └── training/
│           ├── __init__.py
│           └── synthesize_rankings.py
├── scripts/
│   ├── 01_seed_tools.py
│   ├── 02_crawl_official.py
│   ├── 03_build_facts.py
│   └── 04_synthesize_training.py
└── data/
    ├── sources/
    ├── raw/
    ├── processed/
    ├── curated/
    └── training/
```

風險說明（已取得使用者本輪授權）：

- 建立 `.venv`：只影響本專案資料夾；失敗可刪除重來；風險低。
- 官方頁爬取：會對外部網站發 HTTP GET；有 rate limit；風險低～中；不登入、不繞過 CAPTCHA。

---

---

## 3. 步驟 2026-07-17-C：環境建立結果

### 3.1 已建立項目

| 項目 | 路徑 | 說明 |
|---|---|---|
| 虛擬環境 | `.venv/` | Python 3.12；已列入 `.gitignore` |
| 依賴 | `requirements.txt` | httpx, beautifulsoup4, lxml, pyyaml, tenacity, tqdm |
| 套件碼 | `src/kangchiao_data/` | schema / seed / scoring / crawl / process / training |
| 腳本 | `scripts/01`–`05` | 種子→爬取→事實→合成訓練→enrich |
| 資料 | `data/{sources,raw,processed,curated,training}/` | 分層存放 |

### 3.2 依賴調整

- 原先想用第三方 `robots-parser`，PyPI 無對應套件 → **改用標準庫 `urllib.robotparser`**。

### 3.3 重跑指令（本機）

```bash
cd "/Users/kaine/Desktop/康橋/應用導航網站_20260717"
source .venv/bin/activate
python scripts/01_seed_tools.py
python scripts/02_crawl_official.py --delay 1.2
python scripts/05_enrich_from_crawl.py
python scripts/03_build_facts.py
python scripts/04_synthesize_training.py --n 1000
```

---

## 4. 步驟 2026-07-17-D：工具 Schema 與白名單種子

### 4.1 Schema 要點（實作版）

相對規格文件的調整：

- `difficultyStars`: **1–5**（符合 label 參考 md）
- `difficulty`: 由星等映射到 easy/medium/advanced（相容舊概念）
- `shortDescription` / 多數文字欄位：`{"zh-TW","en"}`
- `status`: active | unknown | deprecated | needs_review
- `pageStatus`: 一律先 `placeholder`
- `crawlEnrichment`: 爬取後附加的 title／meta（不覆蓋人工短介，除非人工審核）

### 4.2 白名單結果

- 檔案：`data/curated/tools.json`
- **26 個工具**（Canva 去重；含 Cursor / Claude Code / Codex）
- 驗證：`validate_tool_minimal` → **0 errors**
- 標籤字典：`data/curated/labels.json`
- 手寫驗收情境：`data/curated/use_cases.jsonl`（4 筆）

### 4.3 難易度星等（主觀，可改）

| 星 | 工具 |
|---|---|
| 1 | Canva, Padlet |
| 2 | Gemini, ChatGPT, MagicSchool, Soundraw, Ecrett, NotebookLM, 康軒語音, Curipod, Seesaw, Google Sites, 無邊記, HyRead |
| 3 | Edcafe, MathGPT, Vidnoz, ClassPoint, Stellarium, BrainingCamp, 曉聲通 |
| 4 | SudoAI, Sora, Cursor |
| 5 | Claude Code, Codex |

### 4.4 尚缺官方 URL／需人工確認

- `sudoai`：officialUrl = null
- `konkang_voice`（康軒 AI 語音小助手）：null
- `xiaoshengtong`（曉聲通）：null
- `freeform`：改指向 Apple Support guide（行銷頁 404）
- `hyread`：官網 403，維持 URL 但標記未驗證

---

## 5. 步驟 2026-07-17-E：爬蟲設計與第一次實爬

### 5.1 設計原則

1. **只爬 allowlist**（`data/sources/allowlist.yaml`）
2. Rate limit 預設 ~1.2–1.5s
3. 不登入、不繞 CAPTCHA、不平行轟炸
4. raw HTML 進 `data/raw/`（gitignore）
5. 處理後只保留 title／description／url／hash
6. Reddit 等社群訓練來源：**排除**

### 5.2 robots 策略（相對規格的務實調整）

| robots.txt 狀況 | 行為 |
|---|---|
| 2xx 且可解析 | 遵守 |
| 404 | 視為允許 |
| 其他錯誤 | `robots_unchecked` 仍嘗試 GET（內部原型）；manifest 留痕 |

理由：嚴格 fail-closed 會讓多數教育 SaaS 落地頁完全無法抽 meta，資料階段交不出結果。

### 5.3 第一次爬取結果（2026-07-17）

摘要檔：`data/processed/crawl_run_summary.json`

| 指標 | 值 |
|---|---|
| jobs | 24 |
| ok | 22 |
| fail | 2 |
| extracts | 22 行 `page_extracts.jsonl` |
| manifest | `data/sources/crawl_manifest.jsonl` |

失敗：

| URL | 原因 |
|---|---|
| `apple.com/.../freeform/`（舊路徑） | 404 |
| `www.hyread.com.tw/` | 403 |

### 5.4 爬取發現的重要事實（已回寫產品決策）

1. **Sora**：`openai.com/sora` 轉向停用說明頁（discontinuation）→ 白名單 `status=deprecated`，hard rule 不會推薦。
2. **Canva 首頁**：對此 UA 回「Unsupported client」；**Education 頁正常**，且 meta 提到 K–12 免費 → enrich 寫入 strengths／educationUrl。
3. **NotebookLM / Google Sites**：常被導向登入牆 → extract 可信度低，不當成功能說明。
4. **Edcafe / MathGPT / MagicSchool / Curipod 等**：落地頁可抓到可用 title／description。

### 5.5 allowlist 修正

- OpenAI 的 `/sora` 與 `/codex/` **拆成兩個 domain entry**，避免 toolIds 交叉污染。
- Freeform 路徑改為 Support 文件（行銷 URL 不穩）。

### 5.6 Enrich 腳本

`scripts/05_enrich_from_crawl.py`：把可信 extract 寫入 `tools[].crawlEnrichment`，更新 `lastVerifiedAt`；**不把登入牆 title 當正式介紹**。

---

## 6. 步驟 2026-07-17-F：Layer A 事實與 Tag Scoring

### 6.1 Layer A

- 輸出：`data/processed/tool_facts.jsonl`
- 約 **198** 筆（種子欄位 + 官方 meta）
- 每筆含：toolId, field, value_zh/en, sourceType, sourceUrl, retrievedAt, confidence, licenseNote
- `licenseNote` 預設 `reference_only`（僅供內部整理，不把原文當可再散布語料）

### 6.2 Tag scoring（無 LLM）

實作：`src/kangchiao_data/scoring.py`

權重（初始，可調）：

```text
task +5 | role +3 | level +2 | language +1 | free +3 | specialized +2
```

Hard exclusions：

- `status == deprecated`（例：Sora）
- `freeOnly` 且 `freeStatus == paid`

Smoke test（高中教師／research／只要免費／zh-TW）：

| score | tool | reasons |
|---|---|---|
| 16 | notebooklm | task+role+level+lang+free+research |
| 14 | gemini | task+role+level+lang+free |
| 13 | hyread | task+role+level+lang+research（free unknown） |

檔案：`data/processed/scoring_smoke.json`

### 6.3 手寫 use case 對照（合理即可，非完美）

| case | top3 | 備註 |
|---|---|---|
| 高中教師整理教材 | notebooklm, gemini, hyread | 符合預期 |
| 小學海報 | canva, … | Canva 第一 |
| 大學程式 | claude_code, codex, cursor | 付費允許時進階工具上升；可再調權重 |
| 配樂 | ecrettmusic, soundraw, canva | 音樂工具優先 |

結論：規則層已「可交付、可測」；權重迭代用 prompt／use case 觀察即可（符合使用者「輸入 prompt 看是否合理」的測試方式）。

---

## 7. 步驟 2026-07-17-G：訓練資料（可實現規模）

### 7.1 為何不一次做 6k–12k

- 第一版要先驗證：**資料格式、label 約束、評測腳本、是否優於 tag scoring**。
- Mac M4 Pro 24GB：1B–1.5B + LoRA 用 **~1k 筆** 足夠做第一輪 gate。
- 合成資料若直接上萬筆，容易過擬合模板，反而假樂觀。

### 7.2 本輪產出

| split | 筆數 | 檔案 |
|---|---|---|
| train | 800 | `data/training/train.jsonl` |
| valid | 100 | `data/training/valid.jsonl` |
| test | 100 | `data/training/test.jsonl` |
| card | — | `data/training/dataset_card.md` |

- 體積約 **1.2MB**（遠低於網站／磁碟負擔）
- `reviewStatus`: `synthetic_v1`（**尚未人工驗證**）
- 方法：tag-scoring 當 teacher → 隨機候選順序 → 單 label（A–H / N）
- **下一步（尚未做）**：用選定 tokenizer 確認 label 為單 token；人工抽樣；再談 MLX LoRA

### 7.3 建議的訓練擴充階梯

```text
Gate 0（已完成）: 1,000 synthetic + tag baseline
Gate 1: 人工修 100–200 筆 + tokenizer check
Gate 2: 擴到 3,000（仍以可追蹤模板＋hard negatives）
Gate 3: 6,000–12,000（僅在 Gate1–2 顯示有希望時）
```

若 fine-tune **沒有**穩定超過 tag scoring → **產品不接 LLM**，只保留介面。

---

## 8. 步驟 2026-07-17-H：目錄現況總表

```text
應用導航網站_20260717/
├── AGENT_TECHNICAL_DESIGN_LOG.md   ← 本文件（持續追加）
├── requirements.txt
├── .gitignore
├── .venv/                          ← 39MB（不提交）
├── src/kangchiao_data/
│   ├── schema.py
│   ├── seed_tools.py
│   ├── scoring.py
│   ├── crawl/{allowlist,fetch,extract}.py
│   ├── process/build_facts.py
│   └── training/synthesize_rankings.py
├── scripts/
│   ├── 01_seed_tools.py
│   ├── 02_crawl_official.py
│   ├── 03_build_facts.py
│   ├── 04_synthesize_training.py
│   └── 05_enrich_from_crawl.py
└── data/
    ├── sources/{allowlist.yaml,source_policies.yaml,crawl_manifest.jsonl}
    ├── raw/                        ← 7.1MB HTML cache（不提交）
    ├── processed/{page_extracts,tool_facts,scoring_smoke,...}
    ├── curated/{tools.json,labels.json,use_cases.jsonl}
    └── training/{train,valid,test}.jsonl
```

使用者既有四份規格 md：**未修改**。

---

## 9. 風險、限制與已知問題

1. **免費／價格欄位**多數仍是 curated 估計，不是法務級定論；UI 應顯示「請至官方確認」。
2. **Sora deprecated** 依爬取當日頁面；若 OpenAI 恢復產品需再驗證。
3. **HyRead 403**：無法用此爬蟲驗證落地頁。
4. **康軒語音／曉聲通／SudoAI**：缺官方 URL，不可瞎編。
5. **合成訓練集**不能當真實世界精度證明。
6. **Canva bot 偵測**：需依賴 `/education/` 頁，而非首頁。
7. raw HTML 可能含第三方追蹤腳本字串；勿把 raw 提交公開 repo。

---

## 10. 建議的下一階段（尚未執行）

### 10.1 資料（短）

- 請使用者補：康軒語音、曉聲通、SudoAI 正確官方入口
- 人工抽樣 30 筆 train 標籤是否合理
- 把 Canva Education 免費資訊做成 hard rule 加分（已有 strengths 草稿）

### 10.2 網站（中）— 真正「出版」UI

- Next.js + 讀取 `data/curated/tools.json`
- 漸進式選擇 + tag scoring API
- placeholder `/tools/[slug]`
- 雙語 locales
- Cloudflare 模式 A（無 LLM）

### 10.3 模型（後）

- MLX 1B–1.5B tokenizer label 測試
- 小 LoRA → 對 test 比 tag baseline
- 通過 gate 才接 `LLM_MODE=local`

---

## 11. 本階段 Definition of Done 檢查

| 項目 | 狀態 |
|---|---|
| 目錄 src / .venv / data | 完成 |
| 白名單 tools.json（26） | 完成 |
| 可重跑官方爬蟲 | 完成（22/24 ok） |
| Layer A facts | 完成（198） |
| 合成 ranking 1k | 完成 |
| 單一技術設計 md 持續記錄 | 本文件 |
| 不動使用者規格 md | 遵守 |
| 網站 UI | **未做**（下階段） |
| 真實 LoRA 訓練 | **未做**（等 gate） |

---

## 12. Agent 給使用者的結論（資料階段）

資料層第一版已經**工整可交付**：

- 有白名單、有爬蟲、有事實層、有可擴充訓練格式。
- 推薦核心現在就能用 **tag scoring** 測「prompt／需求是否合理」。
- LLM 訓練規模先鎖在 **~1k → 再 3k → 再 6k+**，符合 M4 Pro 實作節奏。
- 爬蟲不是百科引擎；它的價值是**驗證官方入口仍活著、抓 meta、發現停用（如 Sora）**。

下一步若同意，Agent 可在**不改你規格 md**的前提下，開始做網站 v0.1（讀取本資料目錄）。


---

## 13. 步驟 2026-07-17-I：網站基礎架構建置（無 LLM）

### 13.1 目標

完成可本機展示的 Next.js 網站：漸進式選擇、依學段／身分調整任務與 Prompt、tag scoring 推薦、工具 placeholder 頁、雙語、康橋藍紫風格、響應式與 Motion 動畫。

### 13.2 位置

```text
web/
├── src/app/                 # 首頁 + /tools/[slug]
├── src/components/          # Navigator、結果、Prompt helper
├── src/lib/                 # adaptive / scoring / prompts / i18n
├── src/locales/             # zh-TW.json / en.json
└── src/data/tools.json      # 自 data/curated 複製
```

### 13.3 設計決策

| 項目 | 選擇 |
|---|---|
| 配色 | 康橋藍 `#1B4F9C`、康橋紫 `#6B3D9A`（內部 prototype palette） |
| 字體 | Fraunces（標題）+ Noto Sans TC（內文） |
| 流程 | 同頁 state machine + AnimatePresence |
| 推薦 | 純 tag scoring（無 LLM） |
| 適配 | `getComplexity` → 任務清單、關鍵詞 chips、Prompt 模板分 simple/standard/advanced |
| 動畫 | Motion；尊重 prefers-reduced-motion |
| Logo | 暫用 KC 字標占位（待官方 Logo 檔） |

### 13.4 適配邏輯摘要

- 國小（及國中學生）：任務改為「作業幫忙／整理筆記／更好懂」等較白話選項；Prompt 用短句、步驟化。
- 教師／較高學段：完整備課／評量／研究選項；Prompt 含目標、結構、限制。
- 底層 scoring 仍用 `normalizeTaskForScoring` 對應 tools.json 的 task tags。

### 13.5 驗證

- `cd web && npm run build` 成功
- 靜態產生 26 個 `/tools/[slug]`（含 deprecated 如 Sora，可開但不進推薦）

### 13.6 本機啟動

```bash
cd web
npm run dev
```

開啟 http://localhost:3000

### 13.7 尚未做

- Cloudflare 部署
- 正式康橋 Logo 檔
- LLM / LoRA
- 工具完整介紹文案


---

## 14. 步驟 2026-07-17-J：Kuse 核心置頂、4 筆推薦、友善 UI

### 14.1 變更摘要

1. **新增白名單工具** `kuse`＝[康軒 × Kuse](https://kuse.knsh.com.tw/)，`priorityCore: true`
2. **推薦邏輯**：若 Kuse 能對應任務／學段／身分且未被免費規則排除 → **強制置頂**，並標「核心推薦」；其餘依 tag scoring；**top 4**
3. **難度**：改為 ★☆ 星數＋口語標籤（很好學／好學／還好／要學一下／比較進階）＋「星星愈多＝愈需要學」
4. **CSS**：選項卡／結果卡輕量 ✦✧◇ 閃亮與鑽石裝飾（尊重 reduced-motion）
5. **用詞**：整體改為更平易近人；國小 Prompt／chips 再簡化
6. **移除**「無需登入…Internal Prototype」與頁尾「內部測試版…推薦僅供參考」
7. **Logo**：自康橋官網下載 `logo-dark.png` → `web/public/brand/kangchiao-logo.png`，主頁與 header 顯示  
   來源：https://www.kcis.ntpc.edu.tw/_KangChiao/img/logos/logo-dark.png

### 14.2 驗證

- `npm run build` 成功；`/tools/kuse` 已靜態產生
- 教師＋國小＋備課：Kuse 置頂


---

## 15. 步驟 2026-07-17-K：專項任務優先、拿掉本站說明、星等文案、其他

### 變更

1. 推薦卡**移除「本站介紹」**，只保留官方網站連結
2. 星等標題改為「**這個 AI 工具好不好學**」＋更具體說明
3. 任務選項加重：音樂／聲音、影片、圖片、程式、網頁專案、興趣探索；並加「其他」
4. 新增 **Suno**；Soundraw／Ecrett 補 `sound`；Cursor 等補 `web_project`
5. 評分：專項 category 大幅加分；ChatGPT／Gemini／Kuse 等通用工具在音樂／程式等任務**降權**；Kuse 置頂僅限教學向任務
6. 關鍵詞 chips 改為結果導向白話（老師／學生／專項任務分開）


---

## 16. 步驟 2026-07-17-L：學段分流、主頁去重、字體與按鈕

1. **簡單詞彙**：僅 `學生 + 國小`（國中學生與所有老師改一般用語）
2. **老師學段**：幼兒園／國小／國中／高中（**無大學**）；學生：國小／國中／高中／大學
3. **主頁**：頂欄只留 Logo；主視覺一句 tagline + 大型「開始吧」；去掉重複「應用導航」標題堆疊
4. **字體**：Nunito（標題）+ Noto Sans TC（內文）；英文彎引號改直撇號
5. 幼兒園評分：對應工具若有 `elementary` 標籤亦視為符合

---

## 17. 步驟 2026-07-17-M：行政人員流程、處室任務與主頁文案

### 變更

1. **角色新增「我是行政人員」**；流程為 `角色 → 處室 → 任務 → 關鍵詞 → 補充 → 結果`（不選學段）
2. **處室**：總務、人事、資訊、教務、學務、會計／出納、圖書館、其他；任務與關鍵詞依處室分流（公告、會議紀錄、採購、SOP、家長溝通等）
3. **Prompt**：行政專用提示（正式語氣、草稿標註、禁個資／禁假裝核准）；關鍵詞 chips 含處室＋任務約束
4. **評分**：行政身分對齊教師標籤工具；文書／簡報／研究類加分；Kuse 置頂仍限非創作專項
5. **主頁**：中間不再重複 Logo；改為大標「找到對的工具，少走彎路」＋一句說明＋「開始吧」

---

## 18. 步驟 2026-07-17-N：主頁定稿文案、公開倉庫與上雲

### 變更

1. **主頁文案定稿**  
   - 大標：不知道該用哪個 AI？  
   - 小句：告訴我你的需求，快速找到適合的工具，開始教學、備課或學習  
2. **公開 GitHub**：僅上傳本技術文件作為 md；排除其他規格／需求 md  
3. **部署**：Vercel，專案根目錄指向 `web/`，供對外分享連結

### 倉庫應包含

- `web/`（Next.js 網站）
- `AGENT_TECHNICAL_DESIGN_LOG.md`（本文件）
- `data/curated/`、可選 `data/processed`／`data/training`、`src/`、`scripts/`、`requirements.txt`
- **不包含**：其他使用者規格 md、`.venv`、`node_modules`、`data/raw` 爬蟲快取

---

## 19. 步驟 2026-07-20：擴充工具、影片演算法、6 筆推薦

### 變更

1. **新增 AI 影片工具**：Runway、HeyGen、Pika、Luma Dream Machine（並強化 Vidnoz／Edpuzzle／WeVideo）
2. **自康橋 AI 應用整理表新增**：Recraft、MyEdit、Playground AI、Copilot、Edpuzzle、WeVideo、Pixton
3. **Kuse 難易度改為 1 星**
4. **推薦數量 4 → 6**；結果頁大螢幕 3 欄
5. **影片任務**：`video_boost` 專項加分；通用對話工具降權
6. **Open Kuse 按鈕**：橘色邊框＋淺橘底，更顯眼

