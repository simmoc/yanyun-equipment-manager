import { NextRequest, NextResponse } from 'next/server';
import { getCharactersByUserId, createCharacter, deleteCharacter } from '@/lib/db';
import { getUserByFingerprint } from '@/lib/db';

// 角色管理 API

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
    
    const characters = await getCharactersByUserId(user.id);
    
    return NextResponse.json({
      success: true,
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
        updated_at: c.updated_at
      }))
    });
  } catch (error) {
    console.error('获取角色错误:', error);
    return NextResponse.json(
      { error: '获取角色失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const fingerprint = request.headers.get('x-fingerprint');
    const body = await request.json();
    const { name } = body;
    
    if (!fingerprint) {
      return NextResponse.json(
        { error: '缺少指纹信息' },
        { status: 400 }
      );
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '角色名称不能为空' },
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
    
    const character = await createCharacter(user.id, name.trim());
    
    return NextResponse.json({
      success: true,
      character: {
        id: character.id,
        name: character.name,
        created_at: character.created_at,
        updated_at: character.updated_at
      }
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    return NextResponse.json(
      { error: '创建角色失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const fingerprint = request.headers.get('x-fingerprint');
    const body = await request.json();
    const { characterId } = body;
    
    if (!fingerprint) {
      return NextResponse.json(
        { error: '缺少指纹信息' },
        { status: 400 }
      );
    }
    
    if (!characterId) {
      return NextResponse.json(
        { error: '缺少角色ID' },
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
    
    await deleteCharacter(characterId);
    
    return NextResponse.json({
      success: true,
      message: '角色已删除'
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    return NextResponse.json(
      { error: '删除角色失败' },
      { status: 500 }
    );
  }
}