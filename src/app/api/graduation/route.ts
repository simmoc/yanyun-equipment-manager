import { NextRequest, NextResponse } from 'next/server';
import { getPlansByCharacterId, getEquipmentsByCharacterId } from '@/lib/db';
import { calculateGraduationRate, calculateAllGraduationRates } from '@/lib/graduation';

// 毕业率计算 API

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const characterId = searchParams.get('characterId');
    const planId = searchParams.get('planId');
    
    if (!characterId) {
      return NextResponse.json(
        { error: '缺少角色ID' },
        { status: 400 }
      );
    }
    
    const plans = await getPlansByCharacterId(characterId);
    const equipments = await getEquipmentsByCharacterId(characterId);
    
    // 转换数据格式
    const formattedPlans = plans.map(p => ({
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
    }));
    
    const formattedEquipments = equipments.map(e => ({
      id: e.id,
      character_id: e.character_id,
      slot: e.slot,
      name: e.name,
      level: e.level,
      attributes: e.attributes || [],
      is_wearing: e.is_wearing,
      suit_type: e.suit_type,
      created_at: e.created_at,
      updated_at: e.updated_at
    }));
    
    if (planId) {
      // 计算单个方案的毕业率
      const plan = formattedPlans.find(p => p.id === planId);
      if (!plan) {
        return NextResponse.json(
          { error: '方案不存在' },
          { status: 404 }
        );
      }
      
      const result = calculateGraduationRate(plan, formattedEquipments);
      return NextResponse.json({
        success: true,
        result
      });
    } else {
      // 计算所有方案的毕业率
      const results = calculateAllGraduationRates(formattedPlans, formattedEquipments);
      return NextResponse.json({
        success: true,
        results
      });
    }
  } catch (error) {
    console.error('计算毕业率错误:', error);
    return NextResponse.json(
      { error: '计算毕业率失败' },
      { status: 500 }
    );
  }
}