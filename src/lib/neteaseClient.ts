import type { GameRole } from '@/types';

type AuthCookies = {
  glXsrfToken?: string;
  jsessionId?: string;
  godUuid?: string;
  deviceId?: string;
};

type RoleRequest = {
  roleId: string;
  server: string;
  cookies: AuthCookies;
  loginToken: string;
};

const DIRECT_OFF_UNTIL = 'netease_direct_off_until';
const OFF_MS = 10 * 60 * 1000;

function canTryDirect() {
  if (typeof window === 'undefined') return false;
  return Date.now() > Number(localStorage.getItem(DIRECT_OFF_UNTIL) || 0);
}

function pauseDirect() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DIRECT_OFF_UNTIL, String(Date.now() + OFF_MS));
  }
}

async function sha1(input: string) {
  const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

async function proxy(url: string, body: object): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function getReportToken({ roleId, server, cookies }: RoleRequest) {
  const body = JSON.stringify({ appKey: 'h72', roleId, server, source: 1, type: 'yearly' });
  const response = await fetch('https://inf.ds.163.com/v1/web/game/report/getReportToken', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'gl-checksum': await sha1(body + cookies.glXsrfToken),
      'gl-uid': cookies.godUuid || '',
      'gl-x-xsrf-token': cookies.glXsrfToken || '',
      'gl-clienttype': '60'
    },
    body
  });
  const data = await response.json();
  if (parseInt(data.code, 10) !== 200 || !data.result?.token) {
    throw new Error(data.errmsg || '获取角色token失败');
  }
  return data.result.token as string;
}

async function directRoleEndpoint<T>(path: 'proxyGameRole' | 'roleInfo', request: RoleRequest) {
  const reportToken = await getReportToken(request);
  const body = JSON.stringify({
    server: request.server,
    roleId: request.roleId,
    token: reportToken,
    dts: new Date().getFullYear().toString()
  });
  const response = await fetch(`https://datamsapi.ds.163.com/v1/h72roletool/${path}`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'gl-checksum': await sha1(body + request.cookies.glXsrfToken),
      'gl-uid': request.cookies.godUuid || '',
      'gl-x-xsrf-token': request.cookies.glXsrfToken || '',
      'gl-clienttype': '60',
      'gl-deviceid': request.cookies.deviceId || '36b23252-4813-493a-90d4-a072404579d2'
    },
    body
  });
  const data = await response.json();
  if (parseInt(data.code, 10) !== 0) throw new Error(data.msg || '获取角色数据失败');
  return { data: data.data as T, reportToken };
}

export async function fetchNetEaseRoles(cookies: AuthCookies, loginToken: string): Promise<any> {
  if (canTryDirect()) {
    try {
      const body = '{}';
      const response = await fetch('https://inf.ds.163.com/v1/web/role-list-query/getBindList', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'gl-checksum': await sha1(body + cookies.glXsrfToken),
          'gl-uid': cookies.godUuid || '',
          'gl-x-xsrf-token': cookies.glXsrfToken || ''
        },
        body
      });
      const data = await response.json();
      if (parseInt(data.code, 10) !== 200) throw new Error(data.errmsg || '获取角色列表失败');
      return {
        success: true,
        data: { roles: data.result.filter((role: GameRole) => role.appKey === 'h72'), cookies, loginToken }
      };
    } catch {
      pauseDirect();
    }
  }
  return proxy('/api/auth/roles', { cookies, loginToken });
}

export async function fetchNetEaseRoleInfo(request: RoleRequest): Promise<any> {
  if (canTryDirect()) {
    try {
      const { data, reportToken } = await directRoleEndpoint<Record<string, any>>('proxyGameRole', request);
      return { success: true, data: { roleInfo: data, cookies: request.cookies, loginToken: request.loginToken, reportToken } };
    } catch {
      pauseDirect();
    }
  }
  return proxy('/api/auth/role-info', request);
}

export async function fetchNetEaseRolePanel(request: RoleRequest): Promise<any> {
  if (canTryDirect()) {
    try {
      const { data } = await directRoleEndpoint<Record<string, any>>('roleInfo', request);
      return { success: true, data };
    } catch {
      pauseDirect();
    }
  }
  return proxy('/api/auth/role-panel', request);
}
