import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://q.reg.163.com/qrcode/getqrcodeid?product=cc_team', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    let jsonStr = text.trim();
    
    if (jsonStr.startsWith('200')) {
      jsonStr = jsonStr.replace(/^200\s*/, '');
    }
    
    const firstBraceIndex = jsonStr.indexOf('{');
    if (firstBraceIndex > 0) {
      jsonStr = jsonStr.substring(firstBraceIndex);
    }

    const data = JSON.parse(jsonStr);
    
    if (!data.l?.i) {
      throw new Error('二维码ID格式错误');
    }

    const uuid = data.l.i;
    const qrCodeUrl = `https://q.reg.163.com/qrcode/qrcodeCheckLogin?product=cc_team&params=qrlogin_beac7cff_pc&url=https://cc.163.com/ccaudio/&url2=https://cc.163.com/ccaudio/&uuid=${uuid}`;

    return NextResponse.json({
      success: true,
      data: {
        uuid,
        qrCodeUrl
      }
    });
  } catch (error) {
    console.error('获取二维码失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取二维码失败'
    }, { status: 500 });
  }
}