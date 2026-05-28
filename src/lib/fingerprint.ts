import FingerprintJS from '@fingerprintjs/fingerprintjs';

// 浏览器指纹认证模块
// 使用 FingerprintJS 生成唯一指纹，作为用户身份标识

let fpPromise: Promise<any> | null = null;

// 初始化 FingerprintJS
export function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

// 获取浏览器指纹
export async function getFingerprint(): Promise<string> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('获取指纹失败:', error);
    // 降级方案：使用随机 UUID
    return generateFallbackId();
  }
}

// 降级方案：生成随机 ID
function generateFallbackId(): string {
  return 'fallback-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// 检测是否支持指纹
export async function checkFingerprintSupport(): Promise<boolean> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return !!result.visitorId;
  } catch {
    return false;
  }
}

// 获取指纹详细信息（用于调试）
export async function getFingerprintDetails(): Promise<object> {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return {
      visitorId: result.visitorId,
      confidence: result.confidence,
      components: result.components
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    };
  }
}