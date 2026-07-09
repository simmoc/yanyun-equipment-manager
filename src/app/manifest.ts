import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '燕云十六声装备毕业率管理器',
    short_name: '燕云毕业率',
    description: '燕云十六声竞速玩家的毕业率计算与装备管理平台：DPS模拟、毕业率评估、调律与传承分析。',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'zh-CN',
    categories: ['games', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
