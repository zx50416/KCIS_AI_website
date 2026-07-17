# 康橋 AI 應用導航 — Web

依身分與需求推薦 AI／數位工具，並產生可複製提示詞。技術說明見倉庫根目錄 `AGENT_TECHNICAL_DESIGN_LOG.md`。

## Run locally

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:3000

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Motion for React
- Tag scoring over `src/data/tools.json`
- Locales: `src/locales/zh-TW.json`, `en.json`
