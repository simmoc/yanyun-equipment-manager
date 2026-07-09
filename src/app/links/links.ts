// 友情链接 / 友链交换数据
// 用途：用于 SEO 外链建设——与其他燕云十六声相关站点互相链接，提升双方站点权重。
// 维护：在 friendLinks 数组中添加你的友链。模板如下（取消注释并替换即可）：
//
//   {
//     name: '站点名称',
//     url: 'https://example.com',
//     description: '一句话简介',
//     logo: 'https://example.com/favicon.ico', // 可选
//   },
//
// 注意：
// - url 必须是完整 http(s) 链接
// - 出站链接默认 dofollow（友链交换的常规做法）；如不愿传递权重可给该项加 nofollow: true
// - 避免大量不相关链接（链接农场会被搜索引擎降权）

export interface FriendLink {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  nofollow?: boolean;
}

export const friendLinks: FriendLink[] = [];
