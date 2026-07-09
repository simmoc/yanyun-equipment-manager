import type { Metadata } from 'next';
import Link from 'next/link';
import { friendLinks } from './links';

const SITE_BASE = 'https://yysls.simmoc.cn';

export const metadata: Metadata = {
  title: '友情链接 - 燕云十六声装备毕业率管理器',
  description: '燕云十六声装备毕业率管理器友情链接，收录相关游戏社区、攻略站与工具站点，欢迎友链交换。',
  keywords: ['燕云十六声', '友情链接', '友链交换', '毕业率计算器', '游戏工具', '燕云攻略'],
  alternates: { canonical: `${SITE_BASE}/links` },
  openGraph: {
    title: '友情链接 - 燕云十六声装备毕业率管理器',
    description: '燕云十六声相关社区、攻略与工具站点友情链接，欢迎友链交换。',
    url: `${SITE_BASE}/links`,
    siteName: '燕云十六声装备毕业率管理器',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    title: '友情链接 - 燕云十六声装备毕业率管理器',
    description: '燕云十六声相关社区、攻略与工具站点友情链接。',
  },
};

export default function LinksPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <Link href="/" className="text-emerald-400 text-sm hover:text-emerald-300">
            ← 返回首页
          </Link>
          <h1 className="text-2xl font-bold text-emerald-300 mt-4">友情链接</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            本站与以下优质站点互换友链，共同服务《燕云十六声》玩家。如需交换友链，请在
            <a
              href="https://github.com/simmoc/yanyun-equipment-manager/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              GitHub 提交 Issue
            </a>
            ，注明你的站点名称、链接与简介。
          </p>
        </header>

        {friendLinks.length === 0 ? (
          <div className="text-center text-gray-500 py-16 border border-dashed border-gray-700 rounded-lg">
            友情链接整理中，敬请期待。
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friendLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel={link.nofollow ? 'nofollow noopener noreferrer' : 'noopener noreferrer'}
                  className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors h-full"
                >
                  <div className="flex items-center gap-3">
                    {link.logo && (
                      <img src={link.logo} alt="" className="w-8 h-8 rounded flex-shrink-0" />
                    )}
                    <span className="font-medium text-emerald-300">{link.name}</span>
                  </div>
                  {link.description && (
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">{link.description}</p>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
