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

async function proxy(url: string, body: object): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

export async function fetchNetEaseRoles(cookies: AuthCookies, loginToken: string): Promise<any> {
  return proxy('/api/auth/roles', { cookies, loginToken });
}

export async function fetchNetEaseRoleInfo(request: RoleRequest): Promise<any> {
  return proxy('/api/auth/role-info', request);
}

export async function fetchNetEaseRolePanel(request: RoleRequest): Promise<any> {
  return proxy('/api/auth/role-panel', request);
}
