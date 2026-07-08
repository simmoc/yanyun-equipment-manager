import type { Metadata } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: { default: '燕云十六声装备毕业率管理器', template: '%s | 燕云毕业率' },
  description: '专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台。支持角色装备管理、DPS模拟、毕业率评估。',
  keywords: ['燕云十六声', '毕业率计算器', 'DPS计算', '燕云十六声毕业率', '装备管理'],
  openGraph: {
    title: '燕云十六声装备毕业率管理器',
    description: '专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('theme');
              if (t === 'light') document.documentElement.classList.add('light');
            } catch(e) {}
          `
        }} />
      </head>
      <body className="antialiased">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
