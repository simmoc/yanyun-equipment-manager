// IndexNow 自动提交脚本
// 用途：把站点页面 URL 推送给 Bing / Yandex 等支持 IndexNow 的搜索引擎，
//       替代已下线的 bing.com/ping 匿名接口，加速收录（反向链接生效的前提）。
//
// 原理：public/<key>.txt 是验证文件（文件名即密钥，内容也是密钥）。
//       提交时带上 key + keyLocation，搜索引擎回源校验该文件，通过即收录 urlList。
//
// 用法：
//   1) 部署本仓库（public/<key>.txt 需对外可访问 https://yysls.simmoc.cn/<key>.txt）
//   2) node tools/submit-indexnow.js
//
// 注意：仅在验证文件已上线后提交才会被接受。本地未部署时调用会返回 422。

const fs = require('fs');
const path = require('path');

const HOST = 'yysls.simmoc.cn';

const publicDir = path.join(__dirname, '..', 'public');

// 优先读取已知密钥文件；找不到时回退到扫描 public/ 下 UUID 命名的 .txt
const KNOWN_KEY_FILE = 'cb391448-03f3-445a-8a7c-09150b2e0d10.txt';
let keyFile = null;
if (fs.existsSync(path.join(publicDir, KNOWN_KEY_FILE))) {
  keyFile = KNOWN_KEY_FILE;
} else {
  keyFile = fs.readdirSync(publicDir).find(
    (f) => typeof f === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/i.test(f)
  );
}

if (!keyFile) {
  console.error('[IndexNow] 未在 public/ 找到 IndexNow 密钥文件（格式应为 <uuid>.txt）');
  process.exit(1);
}

const key = fs.readFileSync(path.join(publicDir, keyFile), 'utf8').trim();
const keyLocation = `https://${HOST}/${keyFile}`;

// 需要被收录的页面（仅索引友好的公开页；/share/* 已 noindex，不提交）
const urlList = [
  `https://${HOST}/`,
  `https://${HOST}/links`,
];

const payload = { host: HOST, key, keyLocation, urlList };

(async () => {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`[IndexNow] HTTP ${res.status}`);
    console.log(text || '(empty body)');
    if (res.status === 200) {
      console.log('[IndexNow] 提交成功，搜索引擎将在校验通过后收录以上页面。');
    } else if (res.status === 422) {
      console.log('[IndexNow] 422 = 密钥文件尚未上线或不可访问，请先部署 public/<key>.txt 后重试。');
    } else if (res.status === 400) {
      console.log('[IndexNow] 400 = 请求体不合法，检查 urlList / keyLocation 格式。');
    } else if (res.status === 429) {
      console.log('[IndexNow] 429 = 频率限制，请稍后重试。');
    }
  } catch (err) {
    console.error('[IndexNow] 请求失败：', err.message);
    process.exit(1);
  }
})();
