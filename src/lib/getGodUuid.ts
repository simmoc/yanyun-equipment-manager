export function getGodUuid(): string {
  if (typeof window === 'undefined') return '';
  try {
    const authStr = localStorage.getItem('auth_credentials');
    if (authStr) {
      const auth = JSON.parse(authStr);
      if (auth.cookies?.godUuid) return auth.cookies.godUuid;
    }
    const cacheStr = localStorage.getItem('qrcode_auth_cache');
    if (cacheStr) {
      const cache = JSON.parse(cacheStr);
      if (cache.cookies?.godUuid) return cache.cookies.godUuid;
    }
  } catch {}
  return '';
}
