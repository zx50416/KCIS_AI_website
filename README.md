# 康橋 AI 應用導航

依身分與需求，快速找到合適的 AI／數位工具，並產生可複製的提示詞。

## 線上使用

部署後請以 Vercel 提供的網址分享（見 GitHub Actions／Vercel 專案頁）。

## 本機執行

```bash
cd web
npm install
npm run dev
```

開啟 http://127.0.0.1:3000

## 文件

技術說明（資料來源、推薦邏輯、製作方法）見：[`AGENT_TECHNICAL_DESIGN_LOG.md`](./AGENT_TECHNICAL_DESIGN_LOG.md)

## 部署備註

- Vercel **Root Directory** 請設為 `web`
- 建置指令：`npm run build`（在 `web` 目錄）
