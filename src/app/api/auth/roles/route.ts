import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateChecksum(body: string, xsrfToken: string): string {
  return crypto.createHash('sha1').update(body + xsrfToken).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { cookies, loginToken } = await request.json();

    if (!cookies?.glXsrfToken || !cookies?.jsessionId || !cookies?.godUuid) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的Cookie'
      }, { status: 400 });
    }

    const body = '{}';
    const checksum = generateChecksum(body, cookies.glXsrfToken);

    const response = await fetch('https://inf.ds.163.com/v1/web/role-list-query/getBindList', {
      method: 'POST',
      cache: 'no-store', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 app/df_client dfVersion/100124',
        'Content-Type': 'application/json',
        'gl-checksum': checksum,
        'gl-uid': cookies.godUuid,
        'gl-x-xsrf-token': cookies.glXsrfToken,
        'Cookie': `GL-XSRF-TOKEN=${cookies.glXsrfToken}; JSESSIONID=${cookies.jsessionId}; GOD_UUID=${cookies.godUuid}`
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP错误 ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    if (parseInt(data.code, 10) !== 200) {
      throw new Error(data.errmsg || `获取角色列表失败，错误码: ${data.code}`);
    }

    // 只返回燕云十六声的角色 (appKey = h72)
    const roles = data.result.filter((role: any) => role.appKey === 'h72');

    return NextResponse.json({
      success: true,
      data: {
        roles,
        cookies,
        loginToken
      }
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取角色列表失败'
    }, { status: 500 });
  }
}