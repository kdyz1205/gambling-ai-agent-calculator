import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gamble AI · 毛利 / 回本计算器",
  description: "可调参数的定价、毛利与回本用户数估算（Parse / Judge + 三档产品）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
