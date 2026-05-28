import type { Plan, Equipment, EquipmentSlot, GraduationResult, EquipmentAttribute } from '@/types';
import { EQUIPMENT_SLOTS } from '@/types';

// 毕业率计算模块
// 基于流派方案和装备数据计算毕业率

// 流派属性权重配置
const FLOW_WEIGHTS: Record<string, Record<string, number>> = {
  '鸣金虹': { '攻击力': 1.2, '暴击率': 1.5, '暴击伤害': 1.3, '穿透': 1.1 },
  '鸣金影': { '攻击力': 1.1, '暴击率': 1.4, '暴击伤害': 1.6, '穿透': 1.2 },
  '破竹尘': { '攻击力': 1.3, '穿透': 1.5, '破甲': 1.4 },
  '破竹风': { '攻击力': 1.2, '穿透': 1.4, '破甲': 1.3, '速度': 1.5 },
  '破竹鸢': { '攻击力': 1.1, '穿透': 1.3, '破甲': 1.2, '速度': 1.4 },
  '裂石威': { '防御力': 1.5, '生命值': 1.3, '韧性': 1.4 },
  '裂石钧': { '防御力': 1.4, '生命值': 1.4, '韧性': 1.3, '格挡': 1.5 },
  '牵丝玉': { '攻击力': 1.2, '暴击率': 1.3, '暴击伤害': 1.2, '穿透': 1.1 },
  '牵丝翊': { '攻击力': 1.1, '暴击率': 1.4, '暴击伤害': 1.3, '穿透': 1.2 },
  '牵丝霖': { '攻击力': 1.0, '暴击率': 1.2, '暴击伤害': 1.1, '穿透': 1.0 },
};

// 各部位毕业阈值
const SLOT_THRESHOLDS: Record<EquipmentSlot, number> = {
  '剑': 85,
  '枪': 85,
  '环': 80,
  '佩': 80,
  '冠胄': 75,
  '胸甲': 75,
  '胫甲': 75,
  '腕甲': 75,
};

// 计算单件装备的毕业率
function calculateEquipmentRate(
  equipment: Equipment,
  flowType: string,
  slot: EquipmentSlot
): number {
  const weights = FLOW_WEIGHTS[flowType] || {};
  const threshold = SLOT_THRESHOLDS[slot];
  
  if (!equipment.attributes || equipment.attributes.length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  let maxScore = 0;
  
  equipment.attributes.forEach((attr: EquipmentAttribute) => {
    const weight = weights[attr.name] || 1;
    const score = attr.value * weight;
    totalScore += score;
    maxScore += threshold * weight;
  });
  
  const rate = (totalScore / maxScore) * 100;
  return Math.min(100, Math.max(0, rate));
}

// 计算整体毕业率
export function calculateGraduationRate(
  plan: Plan,
  equipments: Equipment[]
): GraduationResult {
  const slotRates: Record<EquipmentSlot, number> = {} as Record<EquipmentSlot, number>;
  const missingAttributes: string[] = [];
  const recommendations: string[] = [];
  
  // 计算各部位毕业率
  EQUIPMENT_SLOTS.forEach(slot => {
    const slotEquipments = equipments.filter(e => e.slot === slot && e.is_wearing);
    if (slotEquipments.length > 0) {
      // 取最高评分的装备
      const bestEquipment = slotEquipments.reduce((best, current) => {
        const currentRate = calculateEquipmentRate(current, plan.flow_type, slot);
        const bestRate = calculateEquipmentRate(best, plan.flow_type, slot);
        return currentRate > bestRate ? current : best;
      });
      slotRates[slot] = calculateEquipmentRate(bestEquipment, plan.flow_type, slot);
    } else {
      slotRates[slot] = 0;
      missingAttributes.push(`${slot}部位缺少装备`);
      recommendations.push(`建议获取${slot}部位装备`);
    }
  });
  
  // 计算整体毕业率（加权平均）
  const weights = FLOW_WEIGHTS[plan.flow_type] || {};
  let totalRate = 0;
  let totalWeight = 0;
  
  Object.entries(slotRates).forEach(([slot, rate]) => {
    const slotWeight = SLOT_THRESHOLDS[slot as EquipmentSlot] || 1;
    totalRate += rate * slotWeight;
    totalWeight += slotWeight;
  });
  
  const overallRate = totalWeight > 0 ? totalRate / totalWeight : 0;
  
  // 生成建议
  const lowRateSlots = Object.entries(slotRates)
    .filter(([_, rate]) => rate < 70)
    .map(([slot]) => slot);
  
  if (lowRateSlots.length > 0) {
    recommendations.push(`优先提升${lowRateSlots.join('、')}部位的装备属性`);
  }
  
  // 套装检查
  const wearingEquipments = equipments.filter(e => e.is_wearing);
  const suitCounts: Record<string, number> = {};
  wearingEquipments.forEach(e => {
    if (e.suit_type) {
      suitCounts[e.suit_type] = (suitCounts[e.suit_type] || 0) + 1;
    }
  });
  
  const targetSuitCount = suitCounts[plan.suit_type] || 0;
  if (targetSuitCount < 4) {
    recommendations.push(`套装${plan.suit_type}当前${targetSuitCount}件，建议凑齐4件套`);
  }
  
  return {
    plan_id: plan.id,
    overall_rate: Math.round(overallRate * 100) / 100,
    slot_rates: slotRates,
    missing_attributes: missingAttributes,
    recommendations: recommendations
  };
}

// 批量计算多个方案的毕业率
export function calculateAllGraduationRates(
  plans: Plan[],
  equipments: Equipment[]
): GraduationResult[] {
  return plans.map(plan => calculateGraduationRate(plan, equipments));
}

// 获取毕业率等级描述
export function getGraduationLevel(rate: number): string {
  if (rate >= 95) return '完美毕业';
  if (rate >= 85) return '优秀';
  if (rate >= 70) return '良好';
  if (rate >= 50) return '入门';
  return '未达标';
}

// 获取毕业率颜色
export function getGraduationColor(rate: number): string {
  if (rate >= 85) return '#4ade80'; // 绿色
  if (rate >= 70) return '#facc15'; // 黄色
  if (rate >= 50) return '#fb923c'; // 橙色
  return '#f87171'; // 红色
}