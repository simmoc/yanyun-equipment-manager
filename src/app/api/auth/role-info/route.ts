import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateChecksum(body: string, xsrfToken: string): string {
  return crypto.createHash('sha1').update(body + xsrfToken).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { roleId, server, cookies, loginToken } = await request.json();

    if (!roleId || !server || !cookies?.glXsrfToken || !cookies?.jsessionId || !cookies?.godUuid) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    const reportTokenBody = JSON.stringify({
      appKey: 'h72',
      roleId,
      server,
      source: 1,
      type: 'yearly'
    });

    const reportTokenChecksum = generateChecksum(reportTokenBody, cookies.glXsrfToken);

    const tokenResponse = await fetch('https://inf.ds.163.com/v1/web/game/report/getReportToken', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 app/df_client dfVersion/100124',
        'Content-Type': 'application/json;charset=UTF-8',
        'sec-ch-ua': '"Microsoft Edge WebView2";v="141", "Chromium";v="141", "Microsoft Edge";v="141", "Not?A_Brand";v="8"',
        'gl-checksum': reportTokenChecksum,
        'sec-ch-ua-mobile': '?0',
        'gl-uid': cookies.godUuid,
        'gl-x-xsrf-token': cookies.glXsrfToken,
        'gl-clienttype': '60',
        'origin': 'https://act.ds.163.com',
        'referer': 'https://act.ds.163.com/',
        'Cookie': `GL-XSRF-TOKEN=${cookies.glXsrfToken}; JSESSIONID=${cookies.jsessionId}; GOD_UUID=${cookies.godUuid}; NTES_YD_SESS=${cookies.ntesYdSess || ''}`
      },
      body: reportTokenBody
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => '');
      throw new Error(`获取角色token失败，HTTP错误 ${tokenResponse.status}: ${errorText.substring(0, 200)}`);
    }

    const tokenData = await tokenResponse.json();

    if (parseInt(tokenData.code, 10) !== 200) {
      throw new Error(tokenData.errmsg || `获取角色token失败，错误码: ${tokenData.code}`);
    }

    const reportToken = tokenData.result?.token;

    if (!reportToken) {
      throw new Error('获取角色token失败，token为空');
    }

    const body = JSON.stringify({
      server,
      roleId,
      token: reportToken,
      dts: new Date().getFullYear().toString()
    });

    const checksum = generateChecksum(body, cookies.glXsrfToken);

    const response = await fetch('https://datamsapi.ds.163.com/v1/h72roletool/proxyGameRole', {
      method: 'POST',
      cache: 'no-store', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36  app/df_client dfVersion/100124',
        'Content-Type': 'application/json;charset=UTF-8',
        'sec-ch-ua': '"Microsoft Edge WebView2";v="141", "Chromium";v="141", "Microsoft Edge";v="141", "Not?A_Brand";v="8"',
        'gl-checksum': checksum,
        'sec-ch-ua-mobile': '?0',
        'gl-uid': cookies.godUuid,
        'gl-x-xsrf-token': cookies.glXsrfToken,
        'gl-clienttype': '60',
        'gl-deviceid': cookies.deviceId || '36b23252-4813-493a-90d4-a072404579d2',
        'origin': 'https://act.ds.163.com',
        'referer': 'https://act.ds.163.com/',
        'Cookie': `GOD_UUID=${cookies.godUuid}; _ns=${cookies.ns || 'NS1.2.878248400.1779409867'}; NTES_YD_SESS=${cookies.ntesYdSess || ''}; GL-XSRF-TOKEN=${cookies.glXsrfToken}; JSESSIONID=${cookies.jsessionId}`
      },
      body
    });


    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP错误 ${response.status}: ${errorText.substring(0, 200)}相关token: ${reportToken}，checksum: ${checksum}，body: ${body}，headers: ${JSON.stringify(response.headers)}，tokenresponse: ${JSON.stringify(tokenData)}`);
    }

    const data = await response.json();

    console.log('proxyGameRole response:', JSON.stringify(data).substring(0, 500));
    console.log('proxyGameRole keys:', Object.keys(data.data || {}).filter(k => k.includes('combat') || k.includes('equip')).slice(0, 10));

    if (parseInt(data.code, 10) !== 0) {
      throw new Error(data.msg || `获取角色信息失败，错误码: ${data.code}，json: ${JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        roleInfo: data.data,
        cookies,
        loginToken,
        reportToken
      }
    });
  } catch (error) {
    console.error('获取角色信息失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取角色信息失败'
    }, { status: 500 });
  }
}