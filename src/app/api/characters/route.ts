import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, createCharacter, deleteCharacter, getCharacterByRoleId, getCharactersByUuid } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    const characters = uuid ? await getCharactersByUuid(uuid) : [];
    return NextResponse.json({
      success: true,
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        level: c.level,
        server_name: c.server_name,
        role_id: c.role_id,
        server: c.server,
        uuid: c.uuid,
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
    await ensureDb();
    const body = await request.json();
    const { name, icon, level, server_name, role_id, server, uuid } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '角色名称不能为空' },
        { status: 400 }
      );
    }

    if (!role_id) {
      return NextResponse.json(
        { error: '缺少角色ID' },
        { status: 400 }
      );
    }

    if (!uuid) {
      return NextResponse.json(
        { error: '缺少账号标识' },
        { status: 400 }
      );
    }

    const existing = await getCharacterByRoleId(role_id);
    if (existing) {
      if (existing.uuid && existing.uuid !== uuid) {
        return NextResponse.json(
          { success: false, error: '该角色已绑定到其他账号' },
          { status: 403 }
        );
      }

      if (!existing.uuid) {
        const claimedCharacter = await createCharacter(name.trim(), {
          icon, level, server_name, role_id, server, uuid
        });

        if (claimedCharacter) {
          return NextResponse.json({
            success: true,
            character: {
              id: claimedCharacter.id,
              name: claimedCharacter.name,
              icon: claimedCharacter.icon,
              level: claimedCharacter.level,
              server_name: claimedCharacter.server_name,
              role_id: claimedCharacter.role_id,
              server: claimedCharacter.server,
              uuid: claimedCharacter.uuid,
              created_at: claimedCharacter.created_at,
              updated_at: claimedCharacter.updated_at
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        character: {
          id: existing.id,
          name: existing.name,
          icon: existing.icon,
          level: existing.level,
          server_name: existing.server_name,
          role_id: existing.role_id,
          server: existing.server,
          uuid: existing.uuid,
          created_at: existing.created_at,
          updated_at: existing.updated_at
        }
      });
    }

    const character = await createCharacter(name.trim(), {
      icon, level, server_name, role_id, server, uuid
    });

    return NextResponse.json({
      success: true,
      character: {
        id: character.id,
        name: character.name,
        icon: character.icon,
        level: character.level,
        server_name: character.server_name,
        role_id: character.role_id,
        server: character.server,
        uuid: character.uuid,
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
    await ensureDb();
    const body = await request.json();
    const { characterId } = body;

    if (!characterId) {
      return NextResponse.json(
        { error: '缺少角色ID' },
        { status: 400 }
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
