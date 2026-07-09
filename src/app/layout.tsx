import type { Metadata } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

const SITE_URL = 'https://yysls.simmoc.cn';
const SITE_NAME = '燕云十六声装备毕业率管理器';
const SITE_DESC = '专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台。支持角色装备管理、DPS模拟、毕业率评估、调律与传承分析，数据本地保存不上传。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: '%s | 燕云毕业率' },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  category: 'games',
  keywords: [
    '燕云十六声', '毕业率计算器', 'DPS计算', '燕云十六声毕业率', '装备管理',
    '燕云十六声攻略', '毕业率', '流派搭配', '竞速毕业', '装备词条', '调律', '传承'
  ],
  authors: [{ name: 'simmoc', url: 'https://github.com/simmoc' }],
  creator: 'simmoc',
  publisher: 'simmoc',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESC,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '燕云毕业率',
  },
  formatDetection: { telephone: false, email: false, address: false },
  other: {
    'msapplication-TileColor': '#0f172a',
    'theme-color': '#0f172a',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESC,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  inLanguage: 'zh-CN',
  author: { '@type': 'Person', name: 'simmoc', url: 'https://github.com/simmoc' },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
  keywords: '燕云十六声, 毕业率计算器, DPS, 装备管理, 调律, 传承',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
