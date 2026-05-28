import { NextRequest, NextResponse } from 'next/server';
import { getUserByFingerprint, createUser, updateUserLogin } from '@/lib/db';

// 用户认证 API
// 通过浏览器指纹自动登录/注册

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;
    
    if (!fingerprint) {
      return NextResponse.json(
        { error: '缺少指纹信息' },
        { status: 400 }
      );
    }
    
    // 查找现有用户
    let user = await getUserByFingerprint(fingerprint);
    
    if (user) {
      // 更新登录时间
      await updateUserLogin(fingerprint);
    } else {
      // 创建新用户
      user = await createUser(fingerprint);
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fingerprint: user.fingerprint,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('认证错误:', error);
    return NextResponse.json(
      { error: '认证失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const fingerprint = request.headers.get('x-fingerprint');
    
    if (!fingerprint) {
      return NextResponse.json(
        { error: '缺少指纹信息' },
        { status: 400 }
      );
    }
    
    const user = await getUserByFingerprint(fingerprint);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fingerprint: user.fingerprint,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('获取用户错误:', error);
    return NextResponse.json(
      { error: '获取用户失败' },
      { status: 500 }
    );
  }
}