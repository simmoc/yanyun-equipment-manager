import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

// 数据库初始化 API
// 首次部署时调用此接口初始化数据库表

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await initDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '数据库初始化成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('数据库初始化错误:', error);
    return NextResponse.json({
      success: false,
      error: '数据库初始化失败'
    }, { status: 500 });
  }
}
