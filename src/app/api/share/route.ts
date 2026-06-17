import { NextRequest, NextResponse } from 'next/server';
import { createShare } from '@/lib/db';
import { isDbConfigured } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snapshot } = body;

    if (!snapshot) {
      return NextResponse.json(
        { error: '缺少快照数据' },
        { status: 400 }
      );
    }

    if (isDbConfigured()) {
      const share = await createShare(snapshot);
      return NextResponse.json({
        success: true,
        shareId: share.id
      });
    }

    return NextResponse.json(
      { error: 'Server mode requires database' },
      { status: 500 }
    );
  } catch (error) {
    console.error('创建分享错误:', error);
    return NextResponse.json(
      { error: '创建分享失败' },
      { status: 500 }
    );
  }
}
