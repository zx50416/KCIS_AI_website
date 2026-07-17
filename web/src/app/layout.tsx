import type { Metadata } from "next";
import { Nunito, Noto_Sans_TC } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

/** Rounded, friendly Latin display (less formal than serif) */
const display = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/** Clean TC body; pair with Nunito for English-heavy lines */
const body = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "康橋 AI 應用導航",
  description: "幫老師與學生快速找到合適的 AI 與數位工具，並準備好可用的提示詞。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
