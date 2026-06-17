import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getCharacters, getPlansByCharacterId, getEquipmentsByCharacterId, createCharacter, createPlan, createEquipment } from '@/lib/db';
import type { ExportData } from '@/types';

export async function GET() {
  try {
    await ensureDb();
    const characters = await getCharacters();
    const allPlans = [];
    const allEquipments = [];

    for (const character of characters) {
      const plans = await getPlansByCharacterId(character.id);
      const equipments = await getEquipmentsByCharacterId(character.id);

      allPlans.push(...plans.map(p => ({
        id: p.id,
        character_id: p.character_id,
        name: p.name,
        flow_type: p.flow_type,
        version: p.version,
        flow_category: p.flow_category,
        bow_type: p.bow_type,
        suit_type: p.suit_type,
        loan_dingyin: p.loan_dingyin,
        created_at: p.created_at,
        updated_at: p.updated_at
      })));

      allEquipments.push(...equipments.map(e => ({
        id: e.id,
        character_id: e.character_id,
        slot: e.slot,
        name: e.name,
        level: e.level,
        attributes: e.attributes,
        is_wearing: e.is_wearing,
        suit_type: e.suit_type,
        created_at: e.created_at,
        updated_at: e.updated_at
      })));
    }

    const exportData: ExportData = {
      version: '1.0.0',
      export_time: new Date(),
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        created_at: c.created_at,
        updated_at: c.updated_at
      })),
      plans: allPlans,
      equipments: allEquipments
    };

    return NextResponse.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('导出数据错误:', error);
    return NextResponse.json(
      { error: '导出数据失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { data } = body as { data: ExportData };

    if (!data || !data.characters) {
      return NextResponse.json(
        { error: '导入数据格式错误' },
        { status: 400 }
      );
    }

    const characterIdMap: Record<string, string> = {};
    for (const character of data.characters) {
      const newCharacter = await createCharacter(character.name);
      characterIdMap[character.id] = newCharacter.id;
    }

    for (const plan of data.plans) {
      const newCharacterId = characterIdMap[plan.character_id];
      if (newCharacterId) {
        await createPlan(
          newCharacterId, plan.name,
          plan.flow_type, plan.version, plan.flow_category,
          plan.bow_type, plan.suit_type, plan.loan_dingyin
        );
      }
    }

    for (const equipment of data.equipments) {
      const newCharacterId = characterIdMap[equipment.character_id];
      if (newCharacterId) {
        await createEquipment(
          newCharacterId, equipment.slot, equipment.name,
          equipment.level, equipment.attributes,
          equipment.is_wearing, equipment.suit_type
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据导入成功',
      imported: {
        characters: data.characters.length,
        plans: data.plans.length,
        equipments: data.equipments.length
      }
    });
  } catch (error) {
    console.error('导入数据错误:', error);
    return NextResponse.json(
      { error: '导入数据失败' },
      { status: 500 }
    );
  }
}
