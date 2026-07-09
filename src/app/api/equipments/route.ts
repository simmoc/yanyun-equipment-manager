import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getEquipmentsByCharacterId, createEquipment, updateEquipment, deleteEquipment } from '@/lib/db';

// 装备管理 API

export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');
    
    if (!characterId) {
      return NextResponse.json(
        { error: '缺少角色ID' },
        { status: 400 }
      );
    }
    
    const equipments = await getEquipmentsByCharacterId(characterId);
    
    return NextResponse.json({
      success: true,
      equipments: equipments.map(e => ({
        id: e.id,
        character_id: e.character_id,
        slot: e.slot,
        name: e.name,
        level: e.level,
        attributes: e.attributes,
        is_wearing: e.is_wearing,
        suit_type: e.suit_type,
        retone: e.retone,
        legacyTs: e.legacy_ts,
        created_at: e.created_at,
        updated_at: e.updated_at
      }))
    });
  } catch (error) {
    console.error('获取装备错误:', error);
    return NextResponse.json(
      { error: '获取装备失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const {
      characterId,
      slot,
      name,
      level,
      attributes,
      is_wearing: isWearing,
      suit_type: suitType,
      retone,
      legacyTs
    } = body;
    
    if (!characterId || !slot || !name) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const equipment = await createEquipment(
      characterId,
      slot,
      name,
      level ?? 0,
      attributes || [],
      isWearing ?? false,
      suitType,
      retone,
      legacyTs
    );
    
    return NextResponse.json({
      success: true,
      equipment: {
        id: equipment.id,
        character_id: equipment.character_id,
        slot: equipment.slot,
        name: equipment.name,
        level: equipment.level,
        attributes: equipment.attributes,
        is_wearing: equipment.is_wearing,
        suit_type: equipment.suit_type,
        retone: equipment.retone,
        legacyTs: equipment.legacy_ts,
        created_at: equipment.created_at,
        updated_at: equipment.updated_at
      }
    });
  } catch (error) {
    console.error('创建装备错误:', error);
    return NextResponse.json(
      { error: '创建装备失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { equipmentId, updates } = body;
    
    if (!equipmentId || !updates) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const normalizedUpdates = updates
      ? {
        ...updates,
        legacy_ts: updates.legacyTs ?? updates.legacy_ts
      }
      : updates;
    if (normalizedUpdates && 'legacyTs' in normalizedUpdates) {
      delete normalizedUpdates.legacyTs;
    }

    const equipment = await updateEquipment(equipmentId, normalizedUpdates);
    if (!equipment) {
      return NextResponse.json(
        { success: false, error: '装备不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      equipment: {
        id: equipment.id,
        character_id: equipment.character_id,
        slot: equipment.slot,
        name: equipment.name,
        level: equipment.level,
        attributes: equipment.attributes,
        is_wearing: equipment.is_wearing,
        suit_type: equipment.suit_type,
        retone: equipment.retone,
        legacyTs: equipment.legacy_ts,
        created_at: equipment.created_at,
        updated_at: equipment.updated_at
      }
    });
  } catch (error) {
    console.error('更新装备错误:', error);
    return NextResponse.json(
      { error: '更新装备失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { equipmentId } = body;
    
    if (!equipmentId) {
      return NextResponse.json(
        { error: '缺少装备ID' },
        { status: 400 }
      );
    }
    
    await deleteEquipment(equipmentId);
    
    return NextResponse.json({
      success: true,
      message: '装备已删除'
    });
  } catch (error) {
    console.error('删除装备错误:', error);
    return NextResponse.json(
      { error: '删除装备失败' },
      { status: 500 }
    );
  }
}
