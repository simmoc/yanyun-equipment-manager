import { NextRequest, NextResponse } from 'next/server';
import { getShare } from '@/lib/db';
import { isDbConfigured } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '缺少分享ID' },
        { status: 400 }
      );
    }

    if (isDbConfigured()) {
      const share = await getShare(id);
      if (!share) {
        return NextResponse.json(
          { error: '分享不存在或已过期' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        snapshot: share.snapshot,
        created_at: share.created_at
      });
    }

    return NextResponse.json(
      { error: '服务器未配置数据库' },
      { status: 500 }
    );
  } catch (error) {
    console.error('获取分享错误:', error);
    return NextResponse.json(
      { error: '获取分享失败' },
      { status: 500 }
    );
  }
}
