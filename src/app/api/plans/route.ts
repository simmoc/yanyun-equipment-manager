import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getPlansByCharacterId, createPlan, updatePlan, deletePlan } from '@/lib/db';

// 方案管理 API

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
    
    const plans = await getPlansByCharacterId(characterId);
    
    return NextResponse.json({
      success: true,
      plans: plans.map(p => ({
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
      }))
    });
  } catch (error) {
    console.error('获取方案错误:', error);
    return NextResponse.json(
      { error: '获取方案失败' },
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
      name,
      flowType,
      version,
      flowCategory,
      bowType,
      suitType,
      loanDingyin
    } = body;
    
    if (!characterId || !name || !flowType || !version || !flowCategory || !bowType || !suitType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const plan = await createPlan(
      characterId,
      name,
      flowType,
      version,
      flowCategory,
      bowType,
      suitType,
      loanDingyin || false
    );
    
    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        character_id: plan.character_id,
        name: plan.name,
        flow_type: plan.flow_type,
        version: plan.version,
        flow_category: plan.flow_category,
        bow_type: plan.bow_type,
        suit_type: plan.suit_type,
        loan_dingyin: plan.loan_dingyin,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }
    });
  } catch (error) {
    console.error('创建方案错误:', error);
    return NextResponse.json(
      { error: '创建方案失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { planId, updates } = body;
    
    if (!planId || !updates) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const plan = await updatePlan(planId, updates);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: '方案不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        character_id: plan.character_id,
        name: plan.name,
        flow_type: plan.flow_type,
        version: plan.version,
        flow_category: plan.flow_category,
        bow_type: plan.bow_type,
        suit_type: plan.suit_type,
        loan_dingyin: plan.loan_dingyin,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      }
    });
  } catch (error) {
    console.error('更新方案错误:', error);
    return NextResponse.json(
      { error: '更新方案失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { planId } = body;
    
    if (!planId) {
      return NextResponse.json(
        { error: '缺少方案ID' },
        { status: 400 }
      );
    }
    
    await deletePlan(planId);
    
    return NextResponse.json({
      success: true,
      message: '方案已删除'
    });
  } catch (error) {
    console.error('删除方案错误:', error);
    return NextResponse.json(
      { error: '删除方案失败' },
      { status: 500 }
    );
  }
}
