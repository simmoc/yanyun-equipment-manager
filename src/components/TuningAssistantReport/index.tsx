'use client';

import React from 'react';
import type { Equipment, Plan, RolePanelData } from '@/types';

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

interface AffixSummary {
  name: string;
  count: number;
  totalValue: number;
  status: '完美' | '优秀' | '良好' | '注意' | '不足';
  note?: string;
}

interface EquipmentAnalysis {
  name: string;
  slot: string;
  suit: string;
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
  characterName: string;
  rates: RateData[];
  attacks: AttackData[];
  divineAffixes: AffixSummary[];
  weaponDingyin: { status: string; text: string };
  armorDingyin: { status: string; text: string };
  affixSummary: AffixSummary[];
  equipmentAnalysis: EquipmentAnalysis[];
  summary: string;
  recommendations: Recommendation[];
}

interface TuningAssistantReportProps {
  equipments: Equipment[];
  plan: Plan | null;
  rolePanelData?: RolePanelData | null;
}

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

export function TuningAssistantReport({ equipments, plan, rolePanelData }: TuningAssistantReportProps) {
  const reportData = analyzeEquipments(equipments, plan, rolePanelData);
  return <TuningReportView data={reportData} />;
}

function analyzeEquipments(
  dbEquipments: Equipment[],
  plan: Plan | null,
  rolePanelData?: RolePanelData | null
): TuningReportData {
  const attributeStats: Record<string, { count: number; totalValue: number }> = {};
  const equipmentAnalysis: EquipmentAnalysis[] = [];

  const filteredEquipments = dbEquipments.filter(e => e.slot !== '弓' && e.slot !== '射决');

  filteredEquipments.forEach(equip => {
    const affixes: EquipmentAnalysis['affixes'] = [];
    let totalScore = 0;
    let dingyinName: string | null = null;

    equip.attributes?.forEach(attr => {
      if (!attr || !attr.name) return;

      const isGood = GOOD_AFFIXES.some(good => attr.name.includes(good));
      const isBad = BAD_AFFIXES.some(bad => attr.name.includes(bad));
      const isDingyin = DINGYIN_AFFIXES.some(ding => attr.name.includes(ding));

      const rate = attr.rate || 0;
      const quality = attr.quality || 3;
      const rateFraction = rate / 100;

      let score = 0;
      if (isGood) {
        score = rateFraction * 100 * (quality / 3);
        if (isDingyin) score *= 1.2;
      } else if (isBad) {
        score = -30;
      } else {
        score = rateFraction * 50;
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
        isMax: attr.is_main || false,
        isGood
      });
    });

    const avgScore = affixes.length > 0 ? totalScore / affixes.length : 0;
    const finalScore = Math.min(100, avgScore);

    equipmentAnalysis.push({
      name: equip.name,
      slot: equip.slot,
      suit: equip.suit_type || '',
      affixes,
      dingyin: dingyinName,
      score: finalScore
    });
  });

  const acrProb = Number(rolePanelData?.['ACR_PROB'] || 0);
  const criProb = Number(rolePanelData?.['CRI_PROB'] || 0);
  const bashProb = Number(rolePanelData?.['BASH_PROB'] || 0);
  const realAcr = Number(rolePanelData?.['REAL_ACR_PROB'] || acrProb);
  const realCri = Number(rolePanelData?.['REAL_CRI_PROB'] || criProb);
  const realBash = Number(rolePanelData?.['REAL_BASH_PROB'] || bashProb);

  const rates: RateData[] = [
    { name: '精准率', value: realAcr, isHealthy: realAcr >= 40, unit: '%', target: 40 },
    { name: '会心率', value: realCri, isHealthy: realCri >= 60, unit: '%', target: 60 },
    { name: '会意率', value: realBash, isHealthy: realBash >= 30, unit: '%', target: 30 }
  ];

  const minAtk = Number(rolePanelData?.['MIN_W_ATK'] || 0);
  const maxAtk = Number(rolePanelData?.['MAX_W_ATK'] || 0);
  const totalAtk = minAtk + maxAtk;

  const attacks: AttackData[] = [
    {
      name: '综合外攻',
      current: totalAtk > 0 ? String(totalAtk) : '暂无数据',
      isHealthy: totalAtk >= 6000,
      note: totalAtk >= 6000 ? '已达到毕业标准' : totalAtk > 0 ? `未达到毕业标准(≥6000)` : '请先从游戏获取角色面板'
    }
  ];

  const divineAffixes: AffixSummary[] = [
    {
      name: '全武学增效',
      count: attributeStats['全武学增效']?.count || 0,
      totalValue: attributeStats['全武学增效']?.totalValue || 0,
      status: (attributeStats['全武学增效']?.count || 0) >= 2 ? '完美' : (attributeStats['全武学增效']?.count || 0) > 0 ? '良好' : '不足',
      note: (attributeStats['全武学增效']?.count || 0) >= 2 ? '已满配' : (attributeStats['全武学增效']?.count || 0) > 0 ? '已有' : '建议补充'
    },
    {
      name: '对首领单位增伤',
      count: attributeStats['对首领单位增伤']?.count || 0,
      totalValue: attributeStats['对首领单位增伤']?.totalValue || 0,
      status: (attributeStats['对首领单位增伤']?.count || 0) >= 2 ? '完美' : (attributeStats['对首领单位增伤']?.count || 0) > 0 ? '良好' : '不足',
      note: (attributeStats['对首领单位增伤']?.count || 0) >= 2 ? '已满配' : (attributeStats['对首领单位增伤']?.count || 0) > 0 ? '已有' : '建议补充'
    },
    {
      name: '伞武学增效',
      count: attributeStats['伞武学增效']?.count || 0,
      totalValue: attributeStats['伞武学增效']?.totalValue || 0,
      status: (attributeStats['伞武学增效']?.count || 0) >= 2 ? '完美' : (attributeStats['伞武学增效']?.count || 0) > 0 ? '良好' : '不足',
      note: (attributeStats['伞武学增效']?.count || 0) >= 2 ? '已满配' : (attributeStats['伞武学增效']?.count || 0) > 0 ? '已有' : '建议补充'
    }
  ];

  const weaponEquipments = equipmentAnalysis.filter(e => ['主武器', '副武器', '环', '佩'].includes(e.slot));
  const armorEquipments = equipmentAnalysis.filter(e => ['冠胄', '胸甲', '胫甲', '腕甲'].includes(e.slot));

  const weaponDingyin = analyzeDingyin(weaponEquipments);
  const armorDingyin = analyzeDingyin(armorEquipments);

  const importantAffixes = [
    '最大外功攻击', '最小外功攻击', '劲', '会心率', '精准率', '敏',
    '全武学增效', '对首领单位增伤', '外功穿透', '会意率'
  ];

  const affixSummary: AffixSummary[] = importantAffixes.map(name => {
    const stat = attributeStats[name];
    const count = stat?.count || 0;
    const totalValue = stat?.totalValue || 0;
    let status: '完美' | '优秀' | '良好' | '注意' | '不足' = '不足';
    let note = '';

    if (name.includes('外功')) {
      if (count >= 8) { status = '完美'; note = '已达满配'; }
      else if (count >= 6) { status = '优秀'; note = '接近满配'; }
      else if (count >= 4) { status = '良好'; note = '可继续优化'; }
      else { status = '注意'; note = '建议补充'; }
    } else if (name === '劲') {
      if (count >= 6) { status = '完美'; note = '已达满配'; }
      else if (count >= 4) { status = '优秀'; note = '接近满配'; }
      else if (count >= 2) { status = '良好'; note = '可继续补充'; }
      else { status = '注意'; note = '需要补充'; }
    } else if (name === '会心率') {
      if (totalValue >= 60) { status = '完美'; note = '已达标'; }
      else if (totalValue >= 40) { status = '优秀'; note = '接近达标'; }
      else { status = '注意'; note = '建议补充'; }
    } else if (name === '精准率') {
      if (totalValue >= 40) { status = '完美'; note = '已达标'; }
      else if (totalValue >= 30) { status = '优秀'; note = '接近达标'; }
      else { status = '注意'; note = '建议补充'; }
    } else if (name.includes('武学增效') || name.includes('首领')) {
      if (count >= 2) { status = '完美'; note = '已齐全'; }
      else if (count >= 1) { status = '良好'; note = '已有'; }
      else { status = '不足'; note = '建议补充'; }
    } else {
      if (count >= 3) { status = '优秀'; note = '充足'; }
      else if (count >= 1) { status = '良好'; note = '可用'; }
      else { status = '注意'; note = '可慢慢优化'; }
    }

    return { name, count, totalValue, status, note };
  });

  const recommendations = generateRecommendations(
    attributeStats,
    totalAtk,
    equipmentAnalysis,
    rates
  );

  const perfectCount = affixSummary.filter(a => a.status === '完美').length;
  const totalCount = affixSummary.length;
  const summary = perfectCount === totalCount
    ? '装备状态很棒！全身无需要替换的歪词条。(无需要优化的装备)'
    : `${perfectCount}/${totalCount} 个关键词条达到完美状态，建议继续优化其余词条。`;

  return {
    characterName: String(rolePanelData?.['base.nickname'] || ''),
    rates,
    attacks,
    divineAffixes,
    weaponDingyin,
    armorDingyin,
    affixSummary,
    equipmentAnalysis,
    summary,
    recommendations
  };
}

function analyzeDingyin(equipmentAnalysis: EquipmentAnalysis[]) {
  const dingyinCount = equipmentAnalysis.reduce((sum, equip) => {
    const count = equip.affixes.filter(affix =>
      affix.name.includes('增伤') || affix.name.includes('武学') || affix.name.includes('首领')
    ).length;
    return sum + count;
  }, 0);

  let status: string;
  if (dingyinCount >= 4) status = '完美';
  else if (dingyinCount >= 2) status = '良好';
  else status = '注意';

  const equipList = equipmentAnalysis.filter(e => e.dingyin).map(e => e.name).join(', ');

  return {
    status,
    text: `${dingyinCount}/4 定音词条${dingyinCount >= 4 ? '，已齐全' : '，建议补充'}` +
      (equipList ? `\n包含: ${equipList}` : '')
  };
}

function generateRecommendations(
  attributeStats: Record<string, { count: number; totalValue: number }>,
  totalAtk: number,
  equipmentAnalysis: EquipmentAnalysis[],
  rates: RateData[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (totalAtk > 0 && totalAtk < 5000) {
    recommendations.push({
      title: '外攻优化',
      content: `当前外攻约${totalAtk}，建议优先补充外功攻击词条，目标≥6000。`
    });
  } else if (totalAtk > 0 && totalAtk < 6000) {
    recommendations.push({
      title: '外攻优化',
      content: `当前外攻约${totalAtk}，接近毕业标准，可继续补充1-2条外功攻击词条。`
    });
  }

  const jinCount = attributeStats['劲']?.count || 0;
  if (jinCount < 6) {
    recommendations.push({
      title: '劲词条优化',
      content: `当前劲词条${jinCount}条，建议补充至6条以上，能显著提升输出。`
    });
  }

  const acrRate = rates.find(r => r.name === '精准率');
  const criRate = rates.find(r => r.name === '会心率');
  if (acrRate && criRate && (!acrRate.isHealthy || !criRate.isHealthy)) {
    recommendations.push({
      title: '三率优化',
      content: `精准率${acrRate.value.toFixed(1)}%(${acrRate.isHealthy ? '✅' : '❌'})，会心率${criRate.value.toFixed(1)}%(${criRate.isHealthy ? '✅' : '❌'})。`
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
  equipmentAnalysis.forEach(equip => {
    equip.affixes.forEach(affix => {
      if (affix.isGood && affix.rate < 90) {
        lowRateAffixes.push({ name: affix.name, rate: affix.rate, equip: equip.name });
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

  return (
    <div className="space-y-4">
      {data.characterName && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">👤 {data.characterName}</h2>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📊 属性概览</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {data.rates.map((rate, index) => (
            <div key={index} className={`p-3 rounded-lg ${rate.isHealthy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-sm">{rate.name}</span>
                {rate.target && <span className="text-gray-500 text-xs">目标:{rate.target}%</span>}
              </div>
              <div className={`text-xl font-bold ${rate.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {rate.value.toFixed(1)}{rate.unit}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full transition-all ${rate.isHealthy ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(rate.value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {data.attacks.map((attack, index) => (
          <div key={index} className={`p-3 rounded-lg ${attack.isHealthy ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{attack.name}</span>
              <span className={`font-bold ${attack.isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                {attack.current}
              </span>
            </div>
            {attack.note && <div className="text-xs text-gray-500 mt-1">{attack.note}</div>}
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">⚔️ 定音分析</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${getStatusBg(data.weaponDingyin.status)}`}>
            <div className="text-gray-400 text-sm">武器定音</div>
            <div className={`font-bold ${getStatusColor(data.weaponDingyin.status)}`}>
              {data.weaponDingyin.text.split('\n')[0]}
            </div>
            {data.weaponDingyin.text.includes('\n') && (
              <div className="text-xs text-gray-500 mt-1">{data.weaponDingyin.text.split('\n')[1]}</div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getStatusBg(data.armorDingyin.status)}`}>
            <div className="text-gray-400 text-sm">防具定音</div>
            <div className={`font-bold ${getStatusColor(data.armorDingyin.status)}`}>
              {data.armorDingyin.text.split('\n')[0]}
            </div>
            {data.armorDingyin.text.includes('\n') && (
              <div className="text-xs text-gray-500 mt-1">{data.armorDingyin.text.split('\n')[1]}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">✨ 神力词条</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.divineAffixes.map((affix, index) => (
            <div key={index} className={`p-3 rounded-lg ${affix.count > 0 ? 'bg-purple-500/10' : 'bg-gray-700/50'}`}>
              <div className="text-gray-400 text-sm">{affix.name}</div>
              <div className={`font-bold ${affix.count > 0 ? 'text-purple-400' : 'text-gray-500'}`}>
                {affix.count > 0 ? `${affix.count}条` : '未拥有'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📈 词条统计</h2>
        <div className="space-y-2">
          {data.affixSummary.map((affix, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
              <div>
                <span className="text-gray-300 text-sm">{affix.name}</span>
                <span className="text-gray-500 text-xs ml-2">x{affix.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBg(affix.status)} ${getStatusColor(affix.status)}`}>
                  {affix.status}
                </span>
                <span className="text-gray-500 text-xs">{affix.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">🛡️ 装备分析</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {data.equipmentAnalysis.map((equip, index) => (
            <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-gray-200 font-medium">{equip.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{equip.slot}</span>
                  {equip.suit && <span className="text-amber-400 text-xs ml-2">{equip.suit}</span>}
                </div>
                <span className={`text-sm font-bold ${equip.score >= 85 ? 'text-green-400' : equip.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(equip.score)}分
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {equip.affixes.slice(0, 4).map((affix, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs ${affix.isGood ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'}`}
                    title={`${affix.name}: ${affix.value} (${affix.rate.toFixed(1)}%)`}
                  >
                    {affix.name}
                    <span className="ml-1 text-purple-400">L{affix.quality}</span>
                  </span>
                ))}
              </div>
              {equip.dingyin && (
                <div className="text-xs text-purple-400 mt-1">定音: {equip.dingyin}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">💡 调律建议</h2>
        {data.recommendations.length > 0 ? (
          <div className="space-y-3">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="font-semibold text-blue-400 text-sm">{rec.title}</div>
                <div className="text-gray-300 text-xs mt-1 whitespace-pre-line">{rec.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4">暂无建议，装备状态良好！</div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className={`text-center py-2 ${data.summary.includes('很棒') ? 'text-green-400' : 'text-yellow-400'}`}>
          <strong>{data.summary}</strong>
        </div>
      </div>
    </div>
  );
}
