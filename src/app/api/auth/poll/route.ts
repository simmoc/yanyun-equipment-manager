import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function parseResponse(text: string) {
  let jsonStr = text.trim();
  
  if (jsonStr.startsWith('200')) {
    jsonStr = jsonStr.replace(/^200\s*/, '');
  }
  
  const firstBraceIndex = jsonStr.indexOf('{');
  if (firstBraceIndex > 0) {
    jsonStr = jsonStr.substring(firstBraceIndex);
  }

  return JSON.parse(jsonStr);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json({
        success: false,
        error: '缺少uuid参数'
      }, { status: 400 });
    }

    const response = await fetch(
      `https://q.reg.163.com/qrcode/qrcodeauth?product=cc_team&client=pc&newQrCode=1&uuid=${uuid}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
      }
    );

    if (!response.ok) {
      throw new Error('检查二维码状态失败');
    }

    const text = await response.text();
    const data = await parseResponse(text);
    const retCode = parseInt(data.retCode, 10);

    if (retCode === 200) {
      const setCookieUrl = `https://q.reg.163.com/qrcode/qrcodeSetCookie?product=cc_team&url=https://api.cc.163.com/v1/mixteamauth/cookie2LoginToken&url2=https://api.cc.163.com/v1/mixteamauth/cookie2LoginToken&uuid=${uuid}`;
      
      const cookieResponse = await fetch(setCookieUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
      });

      const setCookieHeader = cookieResponse.headers.get('set-cookie');
      let ntesYdSess = '';
      
      if (setCookieHeader) {
        const cookies = setCookieHeader.split(',').map(c => c.trim());
        for (const cookie of cookies) {
          if (cookie.startsWith('NTES_YD_SESS=')) {
            ntesYdSess = cookie.split(';')[0].replace('NTES_YD_SESS=', '');
            break;
          }
        }
      }

      if (!ntesYdSess) {
        throw new Error('获取Cookie失败');
      }

      const tokenResponse = await fetch('https://api.cc.163.com/v1/mixteamauth/cookie2LoginToken', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          'Cookie': `NTES_YD_SESS=${ntesYdSess}`
        }
      });

      if (!tokenResponse.ok) {
        throw new Error('获取token失败');
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.code !== 0 || !tokenData.data?.loginToken) {
        throw new Error('token格式错误');
      }

      const loginToken = tokenData.data.loginToken;

      const loginResponse = await fetch('https://inf.ds.163.com/v1/web/base/login', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 app/df_client dfVersion/100124',
          'Content-Type': 'application/json',
          'Cookie': `NTES_YD_SESS=${ntesYdSess}`
        },
        body: JSON.stringify({ token: loginToken })
      });

      if (!loginResponse.ok) {
        throw new Error('登录网易游戏授权失败');
      }

      const loginSetCookie = loginResponse.headers.get('set-cookie');
      let glXsrfToken = '';
      let jsessionId = '';
      let godUuid = '';

      if (loginSetCookie) {
        const cookies = loginSetCookie.split(',').map(c => c.trim());
        for (const cookie of cookies) {
          if (cookie.startsWith('GL-XSRF-TOKEN=')) {
            glXsrfToken = cookie.split(';')[0].replace('GL-XSRF-TOKEN=', '');
          } else if (cookie.startsWith('JSESSIONID=')) {
            jsessionId = cookie.split(';')[0].replace('JSESSIONID=', '');
          } else if (cookie.startsWith('GOD_UUID=')) {
            godUuid = cookie.split(';')[0].replace('GOD_UUID=', '');
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          status: 'scanned',
          cookies: {
            ntesYdSess,
            glXsrfToken,
            jsessionId,
            godUuid
          },
          loginToken
        }
      });
    }

    if (retCode === 408) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'waiting',
          message: '请使用网易大神扫码'
        }
      });
    } else if (retCode === 409) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'confirming',
          message: '请在手机上确认登录'
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          status: 'error',
          message: `未知状态码: ${retCode}`
        }
      });
    }
  } catch (error) {
    console.error('检查二维码状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '检查二维码状态失败'
    }, { status: 500 });
  }
}