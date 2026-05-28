import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '燕云十六声装备毕业率管理器',
  description: '专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}