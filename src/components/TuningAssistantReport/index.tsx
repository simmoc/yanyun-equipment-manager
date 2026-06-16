'use client';

import React from 'react';
import type { Equipment, Plan, RolePanelData } from '@/types';

interface CapturedEquipment {
  slot: string;
  name: string;
  suffix: number;
  suffix_name: string;
  durability: number;
  retoned: number;
  safe_lock: boolean;
  base_attrs: Record<string, number>;
  base_affixes: Array<{
    id: number;
    name: string;
    value: number;
    rate: number;
    quality: number;
    is_max: boolean;
  }>;
}

interface CapturedXinfa {
  active: Array<{ id: number; name: string }>;
  passive: Array<{ id: number; name: string }>;
}

interface CapturedCharacterInfo {
  base: {
    account: string;
    nickname: string;
    number_id: string;
    level: number;
    school: string;
    school_id: number;
    max_xiuwei_kungfu: number;
  };
  real_attr: {
    AGI?: number;
    BAS?: number;
    CON?: number;
    CRI?: number;
    STR?: number;
    XIUWEI_KUNGFU?: number;
    [key: string]: number | undefined;
  };
  equipments: CapturedEquipment[];
  xinfa: CapturedXinfa;
}

interface CapturedData {
  capture_time: string;
  character_info: CapturedCharacterInfo;
}

interface RateData {
  name: string;
  value: number;
  isHealthy: boolean;
  unit?: string;
  target?: number;
}

interface AttackData {
  name: string;
  current: string;
  isHealthy: boolean;
  note?: string;
}

interface AffixData {
  name: string;
  hasIt: boolean;
  count?: number;
  totalValue?: number;
  note?: string;
}

interface EquipmentAffixData {
  name: string;
  currentCount: number;
  totalValue: number;
  status: '完美' | '优秀' | '良好' | '注意' | '不足';
  note?: string;
}

interface EquipmentAnalysis {
  name: string;
  slot: string;
  suit: string;
  retoned: number;
  affixes: {
    name: string;
    value: number;
    rate: number;
    quality: number;
    isMax: boolean;
    isGood: boolean;
  }[];
  dingyin: string | null;
  score: number;
}

interface Recommendation {
  title: string;
  content: string;
}

interface TuningReportData {
  characterInfo: {
    name: string;
    level: number;
    school: string;
  };
  realAttrs: { name: string; value: number; unit?: string }[];
  rates: RateData[];
  attacks: AttackData[];
  divineAffixes: AffixData[];
  weaponDingyin: {
    status: '完美' | '优秀' | '良好' | '注意';
    text: string;
  };
  armorDingyin: {
    status: '完美' | '优秀' | '良好' | '注意';
    text: string;
  };
  equipmentAffixes: EquipmentAffixData[];
  equipmentAnalysis: EquipmentAnalysis[];
  xinfaAnalysis: {
    active: Array<{ id: number; name: string }>;
    passive: Array<{ id: number; name: string }>;
    note: string;
  };
  summary: string;
  recommendations: Recommendation[];
}

interface TuningAssistantReportProps {
  equipments: Equipment[];
  plan: Plan | null;
  capturedData?: CapturedData | null;
  rolePanelData?: RolePanelData | null;
}

const SLOT_MAP: Record<string, string> = {
  '1': '剑', '2': '枪', '3': '冠胄', '4': '胸甲',
  '5': '胫甲', '8': '腕甲', '9': '射决', '10': '环', '11': '佩', '21': '弓'
};

const GOOD_AFFIXES = [
  '最大外功攻击', '最小外功攻击', '劲', '会心率', '精准率', '敏',
  '全武学增效', '对首领单位增伤', '伞武学增效', '手甲武学增伤',
  '群体类奇术增伤', '天志垂象·蓄力技增伤', '最大破竹攻击', '最小破竹攻击',
  '外功穿透', '会意率'
];

const BAD_AFFIXES = [
  '最大牵丝攻击', '最小牵丝攻击', '最大裂石攻击', '最小裂石攻击',
  '最大鸣金攻击', '最小鸣金攻击', '增疗', '治疗', '防御', '气血',
  '明川药典·武学技增疗'
];

const DINGYIN_AFFIXES = [
  '全武学增效', '对首领单位增伤', '伞武学增效', '手甲武学增伤',
  '群体类奇术增伤', '天志垂象·蓄力技增伤'
];

export function TuningAssistantReport({ equipments, plan, capturedData, rolePanelData }: TuningAssistantReportProps) {
  const reportData = analyzeEquipments(capturedData, equipments, plan, rolePanelData);

  return (
    <TuningReportView data={reportData} />
  );
}

function analyzeEquipments(
  capturedData: CapturedData | undefined | null,
  dbEquipments: Equipment[],
  plan: Plan | null,
  rolePanelData?: RolePanelData | null
): TuningReportData {
  const useCapturedData = (capturedData?.character_info?.equipments?.length ?? 0) > 0;
  const equipments = useCapturedData ? (capturedData?.character_info?.equipments || []) : dbEquipments;
  
  // 优先使用角色面板数据，如果没有就使用捕获数据
  const characterInfo = rolePanelData 
    ? { nickname: rolePanelData['base.nickname'] || '未知', level: rolePanelData['base.level'] || 0, school: '未知' }
    : (capturedData?.character_info?.base || { nickname: '未知', level: 0, school: '未知' });
  
  // 优先从角色面板获取属性
  let realAttrs: Record<string, number | undefined> = {};
  if (rolePanelData) {
    // 从角色面板提取真实属性
    realAttrs = {
      AGI: rolePanelData['AGI'],
      BAS: rolePanelData['BAS'], 
      CON: rolePanelData['CON'],
      CRI: rolePanelData['CRI'],
      STR: rolePanelData['STR'],
      XIUWEI_KUNGFU: rolePanelData['xiuweiExplore']
    };
  } else {
    realAttrs = capturedData?.character_info?.real_attr || {};
  }

  // 处理心法数据
  let xinfa: CapturedXinfa = { active: [], passive: [] };
  if (rolePanelData?.['combat_plan.xinfa_info']) {
    const xinfaData = rolePanelData['combat_plan.xinfa_info'];
    if (Array.isArray(xinfaData)) {
      // 数组格式
      xinfa.active = xinfaData.map(id => ({ id: typeof id === 'object' ? id.id : id, name: '' }));
    } else if (xinfaData && typeof xinfaData === 'object') {
      // 对象格式
      const xinfaList = Object.values(xinfaData);
      xinfa.active = xinfaList.map(xinfa => ({ id: typeof xinfa === 'object' ? xinfa.id : xinfa, name: '' }));
    }
  } else if (capturedData?.character_info?.xinfa) {
    xinfa = capturedData.character_info.xinfa;
  }

  const attributeStats: Record<string, { count: number; totalValue: number }> = {};
  const equipmentAnalysis: EquipmentAnalysis[] = [];

  const processEquipment = (equip: CapturedEquipment | Equipment): EquipmentAnalysis => {
    const affixes: EquipmentAnalysis['affixes'] = [];
    let totalScore = 0;
    let dingyinName: string | null = null;

    if ('base_affixes' in equip) {
      (equip.base_affixes || []).forEach(attr => {
        // 安全检查：确保 attr 和 attr.name 存在
        if (!attr || !attr.name) return;
        
        const isGood = GOOD_AFFIXES.some(good => attr.name?.includes(good));
        const isBad = BAD_AFFIXES.some(bad => attr.name?.includes(bad));
        const isDingyin = DINGYIN_AFFIXES.some(ding => attr.name?.includes(ding));

        const rate = attr.rate || 0;
        const quality = attr.quality || 3;

        let score = 0;
        if (isGood) {
          score = (rate / 100) * 100 * (quality / 3);
          if (isDingyin) score *= 1.2;
        } else if (isBad) {
          score = -30;
        } else {
          score = (rate / 100) * 50;
        }
        totalScore += score;

        if (!attributeStats[attr.name]) {
          attributeStats[attr.name] = { count: 0, totalValue: 0 };
        }
        attributeStats[attr.name].count++;
        attributeStats[attr.name].totalValue += attr.value || 0;

        if (isDingyin && !dingyinName) {
          dingyinName = attr.name;
        }

        affixes.push({
          name: attr.name,
          value: attr.value || 0,
          rate: rate,
          quality: quality,
          isMax: attr.is_max || false,
          isGood
        });
      });
    } else {
      (equip.attributes || []).forEach(attr => {
        // 安全检查：确保 attr 和 attr.name 存在
        if (!attr || !attr.name) return;
        
        const isGood = GOOD_AFFIXES.some(good => attr.name?.includes(good));
        const isBad = BAD_AFFIXES.some(bad => attr.name?.includes(bad));
        const isDingyin = DINGYIN_AFFIXES.some(ding => attr.name?.includes(ding));

        const rate = attr.rate || 0;
        const quality = attr.quality || 3;

        let score = 0;
        if (isGood) {
          score = rate * 100 * (quality / 3);
          if (isDingyin) score *= 1.2;
        } else if (isBad) {
          score = -30;
        } else {
          score = rate * 50;
        }
        totalScore += score;

        if (!attributeStats[attr.name]) {
          attributeStats[attr.name] = { count: 0, totalValue: 0 };
        }
        attributeStats[attr.name].count++;
        attributeStats[attr.name].totalValue += attr.value || 0;

        if (isDingyin && !dingyinName) {
          dingyinName = attr.name;
        }

        affixes.push({
          name: attr.name,
          value: attr.value || 0,
          rate: rate * 100,
          quality: quality,
          isMax: attr.is_main || false,
          isGood
        });
      });
    }

    const capturedEquip = equip as CapturedEquipment;
    const dbEquip = equip as Equipment;
    const isCaptured = 'base_affixes' in equip;
    
    const slot = isCaptured ? (typeof capturedEquip.slot === 'string' ? SLOT_MAP[capturedEquip.slot] || capturedEquip.slot : capturedEquip.slot) : dbEquip.slot;
    const suit = isCaptured ? capturedEquip.suffix_name : dbEquip.suit_type || '';
    const retoned = isCaptured ? capturedEquip.retoned : 0;
    
    const retonedBonus = Math.min(retoned * 5, 20);
    const finalScore = Math.min(100, (totalScore / (affixes.length || 1)) + retonedBonus);

    return {
      name: equip.name,
      slot,
      suit,
      retoned,
      affixes,
      dingyin: dingyinName,
      score: finalScore
    };
  };

  equipments.forEach(equip => {
    equipmentAnalysis.push(processEquipment(equip as CapturedEquipment | Equipment));
  });

  // 优先使用角色面板数据，其次使用装备计算的数据
  let acrProb: number, criProb: number, bashProb: number;
  
  if (rolePanelData) {
    acrProb = rolePanelData['REAL_ACR_PROB'] || rolePanelData['ACR_PROB'] || 0;
    criProb = rolePanelData['REAL_CRI_PROB'] || rolePanelData['CRI_PROB'] || 0;
    bashProb = rolePanelData['REAL_BASH_PROB'] || rolePanelData['BASH_PROB'] || 0;
  } else {
    acrProb = attributeStats['精准率']?.totalValue || 0;
    criProb = attributeStats['会心率']?.totalValue || 0;
    bashProb = attributeStats['会意率']?.totalValue || 0;
  }

  const rates: RateData[] = [
    {
      name: '精准率',
      value: acrProb * 100,
      isHealthy: acrProb >= 0.4,
      unit: '%',
      target: 40
    },
    {
      name: '会心率',
      value: criProb * 100,
      isHealthy: criProb >= 0.6,
      unit: '%',
      target: 60
    },
    {
      name: '会意率',
      value: bashProb * 100,
      isHealthy: bashProb >= 0.3,
      unit: '%',
      target: 30
    }
  ];

  // 计算攻击力：优先使用角色面板，其次使用装备计算
  let minAtk: number, maxAtk: number, totalAtk: number;
  
  if (rolePanelData && rolePanelData['MIN_W_ATK'] && rolePanelData['MAX_W_ATK']) {
    minAtk = Number(rolePanelData['MIN_W_ATK']);
    maxAtk = Number(rolePanelData['MAX_W_ATK']);
    totalAtk = minAtk + maxAtk;
  } else {
    minAtk = (attributeStats['最小外功攻击']?.totalValue || 0) * 300 + 
                   (attributeStats['MIN_W_ATK']?.totalValue || 0);
    maxAtk = (attributeStats['最大外功攻击']?.totalValue || 0) * 500 + 
                   (attributeStats['MAX_W_ATK']?.totalValue || 0);
    totalAtk = minAtk + maxAtk;
  }

  const attacks: AttackData[] = [
    {
      name: '综合外攻',
      current: `约${Math.round(totalAtk)}`,
      isHealthy: totalAtk >= 6000,
      note: totalAtk >= 6000 ? '已达到毕业标准' : '未达到毕业标准(≥6000)'
    }
  ];

  const divineAffixes: AffixData[] = [
    {
      name: '全武学增效',
      hasIt: attributeStats['全武学增效']?.count! > 0,
      count: attributeStats['全武学增效']?.count || 0,
      totalValue: attributeStats['全武学增效']?.totalValue || 0,
      note: attributeStats['全武学增效']?.count! >= 2 ? '已满配' : attributeStats['全武学增效']?.count! > 0 ? '已有' : '建议补充'
    },
    {
      name: '对首领单位增伤',
      hasIt: attributeStats['对首领单位增伤']?.count! > 0,
      count: attributeStats['对首领单位增伤']?.count || 0,
      totalValue: attributeStats['对首领单位增伤']?.totalValue || 0,
      note: attributeStats['对首领单位增伤']?.count! >= 2 ? '已满配' : attributeStats['对首领单位增伤']?.count! > 0 ? '已有' : '建议补充'
    },
    {
      name: '伞武学增效',
      hasIt: attributeStats['伞武学增效']?.count! > 0,
      count: attributeStats['伞武学增效']?.count || 0,
      totalValue: attributeStats['伞武学增效']?.totalValue || 0,
      note: attributeStats['伞武学增效']?.count! >= 2 ? '已满配' : attributeStats['伞武学增效']?.count! > 0 ? '已有' : '建议补充'
    }
  ];

  const weaponEquipments = equipmentAnalysis.filter(e => ['剑', '枪', '环', '佩'].includes(e.slot));
  const armorEquipments = equipmentAnalysis.filter(e => ['冠胄', '胸甲', '胫甲', '腕甲'].includes(e.slot));

  const weaponDingyin = analyzeDingyin(weaponEquipments);
  const armorDingyin = analyzeDingyin(armorEquipments);

  const importantAffixes = [
    '最大外功攻击', '最小外功攻击', '劲', '会心率', '精准率', '敏',
    '全武学增效', '对首领单位增伤', '外功穿透', '会意率'
  ];

  const equipmentAffixes: EquipmentAffixData[] = importantAffixes.map(name => {
    const stat = attributeStats[name];
    const count = stat?.count || 0;
    const totalValue = stat?.totalValue || 0;
    let status: '完美' | '优秀' | '良好' | '注意' | '不足' = '不足';
    let note = '';

    if (name.includes('外功')) {
      if (count >= 8) { status = '完美'; note = '已达满配' }
      else if (count >= 6) { status = '优秀'; note = '接近满配' }
      else if (count >= 4) { status = '良好'; note = '可继续优化' }
      else { status = '注意'; note = '建议补充' }
    } else if (name === '劲') {
      if (count >= 6) { status = '完美'; note = '已达满配' }
      else if (count >= 4) { status = '优秀'; note = '接近满配' }
      else if (count >= 2) { status = '良好'; note = '可继续补充' }
      else { status = '注意'; note = '需要补充' }
    } else if (name === '会心率') {
      if (totalValue >= 0.6) { status = '完美'; note = '已达标' }
      else if (totalValue >= 0.4) { status = '优秀'; note = '接近达标' }
      else { status = '注意'; note = '建议补充' }
    } else if (name === '精准率') {
      if (totalValue >= 0.4) { status = '完美'; note = '已达标' }
      else if (totalValue >= 0.3) { status = '优秀'; note = '接近达标' }
      else { status = '注意'; note = '建议补充' }
    } else if (name.includes('武学增效') || name.includes('首领')) {
      if (count >= 2) { status = '完美'; note = '已齐全' }
      else if (count >= 1) { status = '良好'; note = '已有' }
      else { status = '不足'; note = '建议补充' }
    } else {
      if (count >= 3) { status = '优秀'; note = '充足' }
      else if (count >= 1) { status = '良好'; note = '可用' }
      else { status = '注意'; note = '可慢慢优化' }
    }

    return { name, currentCount: count, totalValue, status, note };
  });

  const recommendations = generateRecommendations(
    attributeStats,
    totalAtk,
    equipmentAnalysis.length,
    equipmentAnalysis,
    plan
  );

  const perfectCount = equipmentAffixes.filter(a => a.status === '完美').length;
  const totalCount = equipmentAffixes.length;
  const summary = perfectCount === totalCount 
    ? '装备状态很棒！全身无需要替换的歪词条。(无需要优化的装备)'
    : `${perfectCount}/${totalCount} 个关键词条达到完美状态，建议继续优化其余词条。`;

  const realAttrList = Object.entries(realAttrs).map(([key, value]) => ({
    name: key,
    value: value || 0,
    unit: key === 'CRI' ? '' : ''
  }));

  let xinfaNote = '';
  if (xinfa.active.length === 0 && xinfa.passive.length === 0) {
    xinfaNote = '未配置心法';
  } else {
    xinfaNote = `${xinfa.active.length}个主动心法，${xinfa.passive.length}个被动心法`;
  }

  return {
    characterInfo: {
      name: characterInfo.nickname,
      level: characterInfo.level,
      school: characterInfo.school
    },
    realAttrs: realAttrList,
    rates,
    attacks,
    divineAffixes,
    weaponDingyin,
    armorDingyin,
    equipmentAffixes,
    equipmentAnalysis,
    xinfaAnalysis: {
      active: xinfa.active,
      passive: xinfa.passive,
      note: xinfaNote
    },
    summary,
    recommendations
  };
}

function analyzeDingyin(equipmentAnalysis: EquipmentAnalysis[]) {
  const dingyinCount = (equipmentAnalysis || []).reduce((sum, equip) => {
    const dingyinAttrs = (equip?.affixes || []).filter(affix => 
      affix?.name?.includes('增伤') || affix?.name?.includes('武学') || affix?.name?.includes('首领')
    );
    return sum + dingyinAttrs.length;
  }, 0);

  return {
    status: dingyinCount >= 4 ? '完美' as const : dingyinCount >= 2 ? '良好' as const : '注意' as const,
    text: `${dingyinCount}/4 定音词条${dingyinCount >= 4 ? '，已齐全' : '，建议补充'}` +
      (dingyinCount > 0 ? `\n包含: ${equipmentAnalysis.filter(e => e.dingyin).map(e => e.name).join(', ')}` : '')
  };
}

function generateRecommendations(
  attributeStats: Record<string, { count: number; totalValue: number }>,
  totalAtk: number,
  equipCount: number,
  equipmentAnalysis: EquipmentAnalysis[],
  plan: Plan | null
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (totalAtk < 5000) {
    recommendations.push({
      title: '外攻优化',
      content: `当前外攻约${Math.round(totalAtk)}，建议优先补充外功攻击词条，目标≥6000。`
    });
  } else if (totalAtk < 6000) {
    recommendations.push({
      title: '外攻优化',
      content: `当前外攻约${Math.round(totalAtk)}，接近毕业标准，可继续补充1-2条外功攻击词条。`
    });
  }

  const jinCount = attributeStats['劲']?.count || 0;
  if (jinCount < 6) {
    recommendations.push({
      title: '劲词条优化',
      content: `当前劲词条${jinCount}条，建议补充至6条以上，能显著提升输出。`
    });
  }

  const acrTotal = attributeStats['精准率']?.totalValue || 0;
  const criTotal = attributeStats['会心率']?.totalValue || 0;
  if (acrTotal < 0.4 || criTotal < 0.6) {
    recommendations.push({
      title: '三率优化',
      content: `精准率${(acrTotal * 100).toFixed(1)}%(${acrTotal >= 0.4 ? '✅' : '❌'})，会心率${(criTotal * 100).toFixed(1)}%(${criTotal >= 0.6 ? '✅' : '❌'})。`
    });
  }

  const badEquipments = equipmentAnalysis.filter(e => e.score < 70);
  if (badEquipments.length > 0) {
    recommendations.push({
      title: '装备优化建议',
      content: `以下装备评分较低，建议重点关注：\n${badEquipments.map(e => `${e.name}(${e.slot}) - 评分${Math.round(e.score)}`).join('\n')}`
    });
  }

  const lowRateAffixes: { name: string; rate: number; equip: string }[] = [];
  (equipmentAnalysis || []).forEach(equip => {
    (equip?.affixes || []).forEach(affix => {
      if (affix?.isGood && affix?.rate < 90) {
        lowRateAffixes.push({ name: affix?.name || '', rate: affix?.rate || 0, equip: equip?.name || '' });
      }
    });
  });
  if (lowRateAffixes.length > 0) {
    recommendations.push({
      title: '低词条优化',
      content: `以下关键词条数值较低，建议洗练提升：\n${lowRateAffixes.slice(0, 5).map(a => `${a.name} - ${a.rate.toFixed(1)}% (${a.equip})`).join('\n')}`
    });
  }

  const badAffixes: { name: string; equip: string }[] = [];
  equipmentAnalysis.forEach(equip => {
    equip.affixes.forEach(affix => {
      if (!affix.isGood && BAD_AFFIXES.some(bad => affix.name.includes(bad))) {
        badAffixes.push({ name: affix.name, equip: equip.name });
      }
    });
  });
  if (badAffixes.length > 0) {
    recommendations.push({
      title: '歪词条清理',
      content: `以下装备包含不适合的词条，建议洗练替换：\n${badAffixes.slice(0, 5).map(b => `${b.equip}: ${b.name}`).join('\n')}`
    });
  }

  return recommendations;
}

function TuningReportView({ data }: { data: TuningReportData }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '完美': return 'text-green-400';
      case '优秀': return 'text-blue-400';
      case '良好': return 'text-yellow-400';
      case '注意': return 'text-orange-400';
      case '不足': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case '完美': return 'bg-green-500/20';
      case '优秀': return 'bg-blue-500/20';
      case '良好': return 'bg-yellow-500/20';
      case '注意': return 'bg-orange-500/20';
      case '不足': return 'bg-red-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getQualityColor = (quality: number) => {
    switch (quality) {
      case 1: return 'text-gray-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-purple-400';
      case 4: return 'text-orange-400';
      case 5: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">👤 角色信息</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <div className="text-gray-400 text-sm">角色名</div>
            <div className="text-white font-bold">{data.characterInfo?.name || '未知'}</div>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <div className="text-gray-400 text-sm">等级</div>
            <div className="text-white font-bold">{data.characterInfo?.level || 0}</div>
          </div>
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <div className="text-gray-400 text-sm">门派</div>
            <div className="text-white font-bold">{data.characterInfo?.school || '未知'}</div>
          </div>
        </div>
        
        {(data.realAttrs || []).length > 0 && (
          <div>
            <div className="text-gray-400 text-sm mb-2">基础属性</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {(data.realAttrs || []).map((attr, index) => (
                <div key={index} className="p-2 bg-gray-700/30 rounded text-center">
                  <div className="text-gray-500 text-xs">{attr?.name || ''}</div>
                  <div className="text-gray-200 font-medium">{(attr?.value || 0).toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📊 属性概览</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          {(data.rates || []).map((rate, index) => (
            <div key={index} className={`p-3 rounded-lg ${rate?.isHealthy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-sm">{rate?.name || ''}</span>
                {rate?.target && <span className="text-gray-500 text-xs">目标:{rate.target}%</span>}
              </div>
              <div className={`text-xl font-bold ${rate?.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {(rate?.value || 0).toFixed(1)}{rate?.unit || ''}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div 
                  className={`h-1 rounded-full transition-all ${rate?.isHealthy ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(rate?.value || 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {(data.attacks || []).map((attack, index) => (
          <div key={index} className={`p-3 rounded-lg ${attack?.isHealthy ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{attack?.name || ''}</span>
              <span className={`font-bold ${attack?.isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                {attack?.current || ''}
              </span>
            </div>
            {attack?.note && <div className="text-xs text-gray-500 mt-1">{attack.note}</div>}
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">⚔️ 定音分析</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${getStatusBg(data.weaponDingyin?.status || '注意')}`}>
            <div className="text-gray-400 text-sm">武器定音</div>
            <div className={`font-bold ${getStatusColor(data.weaponDingyin?.status || '注意')}`}>
              {data.weaponDingyin?.text?.split('\n')[0] || '待分析'}
            </div>
            {data.weaponDingyin?.text?.includes('\n') && (
              <div className="text-xs text-gray-500 mt-1">
                {data.weaponDingyin.text.split('\n')[1]}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getStatusBg(data.armorDingyin?.status || '注意')}`}>
            <div className="text-gray-400 text-sm">防具定音</div>
            <div className={`font-bold ${getStatusColor(data.armorDingyin?.status || '注意')}`}>
              {data.armorDingyin?.text?.split('\n')[0] || '待分析'}
            </div>
            {data.armorDingyin?.text?.includes('\n') && (
              <div className="text-xs text-gray-500 mt-1">
                {data.armorDingyin.text.split('\n')[1]}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">✨ 神力词条</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {(data.divineAffixes || []).map((affix, index) => (
            <div key={index} className={`p-3 rounded-lg ${affix?.hasIt ? 'bg-purple-500/10' : 'bg-gray-700/50'}`}>
              <div className="text-gray-400 text-sm">{affix?.name || '未知'}</div>
              <div className={`font-bold ${affix?.hasIt ? 'text-purple-400' : 'text-gray-500'}`}>
                {affix?.hasIt ? `${affix.count}条` : '未拥有'}
              </div>
              {affix?.totalValue && affix.totalValue > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  总加成: {(affix.totalValue * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📈 词条统计</h2>
        
        <div className="space-y-2">
          {(data.equipmentAffixes || []).map((affix, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
              <div>
                <span className="text-gray-300 text-sm">{affix?.name || '未知'}</span>
                <span className="text-gray-500 text-xs ml-2">x{affix?.currentCount || 0}</span>
                {affix?.totalValue > 0 && (
                  <span className="text-gray-500 text-xs ml-2">
                    ({typeof affix.totalValue === 'number' && affix.totalValue < 1 ? (affix.totalValue * 100).toFixed(1) : Math.round(affix.totalValue || 0)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBg(affix?.status || '注意')} ${getStatusColor(affix?.status || '注意')}`}>
                  {affix?.status || '待分析'}
                </span>
                <span className="text-gray-500 text-xs">{affix?.note || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">🛡️ 装备分析</h2>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {(data.equipmentAnalysis || []).map((equip, index) => (
            <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-gray-200 font-medium">{equip?.name || '未知'}</span>
                  <span className="text-gray-500 text-xs ml-2">{equip?.slot || ''}</span>
                  {equip?.suit && <span className="text-amber-400 text-xs ml-2">{equip.suit}</span>}
                  {equip?.retoned > 0 && <span className="text-blue-400 text-xs ml-2">重锻{equip.retoned}</span>}
                </div>
                <span className={`text-sm font-bold ${(equip?.score || 0) >= 85 ? 'text-green-400' : (equip?.score || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(equip?.score || 0)}分
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(equip?.affixes || []).slice(0, 4).map((affix, i) => (
                  <span 
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs ${affix?.isGood ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'}`}
                    title={`${affix?.name || ''}: ${affix?.value || 0} (${(affix?.rate || 0).toFixed(1)}%)`}
                  >
                    {affix?.name || ''}
                    <span className={`ml-1 ${getQualityColor(affix?.quality || 1)}`}>
                      L{affix?.quality || 1}
                    </span>
                  </span>
                ))}
              </div>
              {equip?.dingyin && (
                <div className="text-xs text-purple-400 mt-1">
                  定音: {equip.dingyin}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📚 心法配置</h2>
        
        <div className="space-y-3">
          {(data.xinfaAnalysis?.active || []).length > 0 && (
            <div>
              <div className="text-gray-400 text-sm mb-2">主动心法</div>
              <div className="flex flex-wrap gap-2">
                {(data.xinfaAnalysis.active || []).map((xinfa, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    {xinfa?.name || `心法${xinfa?.id || index}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(data.xinfaAnalysis?.passive || []).length > 0 && (
            <div>
              <div className="text-gray-400 text-sm mb-2">被动心法</div>
              <div className="flex flex-wrap gap-2">
                {(data.xinfaAnalysis.passive || []).map((xinfa, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                    {xinfa?.name || `心法${xinfa?.id || index}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          {((data.xinfaAnalysis?.active || []).length === 0 && (data.xinfaAnalysis?.passive || []).length === 0) && (
            <div className="text-gray-500 text-sm">未配置心法</div>
          )}
          <div className="text-xs text-gray-500 mt-2">{data.xinfaAnalysis?.note || ''}</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">💡 调律建议</h2>
        
        {(data.recommendations || []).length > 0 ? (
          <div className="space-y-3">
            {(data.recommendations || []).map((rec, index) => (
              <div key={index} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="font-semibold text-blue-400 text-sm">{rec?.title || ''}</div>
                <div className="text-gray-300 text-xs mt-1 whitespace-pre-line">{rec?.content || ''}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4">暂无建议，装备状态良好！</div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className={`text-center py-2 ${(data.summary || '').includes('很棒') ? 'text-green-400' : 'text-yellow-400'}`}>
          <strong>{data.summary || '分析完成'}</strong>
        </div>
      </div>
    </div>
  );
}