'use client';

import React, { useState, useEffect } from 'react';
import type { Equipment, Plan, RolePanelData } from '@/types';
import { FLOW_TYPES } from '@/types';
import { getScoreColor } from '@/lib/scoreConfig';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RateData {
  name: string;
  value: number;
  isHealthy: boolean;
  unit?: string;
  target?: string;
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
    tier: string;
    score: number;
  }[];
  dingyin: string | null;
  score: number;
  slotAdvice: string;
}

interface Recommendation {
  title: string;
  content: string;
}

interface XinfaCheckResult {
  equipped: Array<{ id: string; name: string; isCorrect: boolean }>;
  missing: string[];
  recommendedSets: string[][];
}

interface TuningReportData {
  characterName: string;
  flowType: string;
  version: string;
  rates: RateData[];
  rawRates: RateData[];
  attacks: AttackData[];
  divineAffixes: AffixSummary[];
  weaponDingyin: { status: string; text: string };
  armorDingyin: { status: string; text: string };
  affixSummary: AffixSummary[];
  equipmentAnalysis: EquipmentAnalysis[];
  summary: string;
  recommendations: Recommendation[];
  suitStatus: { recommended: string; current: string; isMatch: boolean };
  xinfaCheck: XinfaCheckResult | null;
  dingyinTargets?: Record<string, string>;
}

interface ApiTuningAdvice {
  section1: {
    title: string;
    tabs: Array<{
      id: string;
      label: string;
      entries: Array<{ name: string; desc: string }>;
    }>;
  };
  section2: { title: string; tabs: Array<{ name: string; num: string }> };
  section3: { title: string; tips: Array<{ title: string; content: string }> };
}

interface ApiFlowEntry {
  value: string;
  wuxue?: string[];
  xinfa?: { commend: string[][]; position?: string[] };
  equit?: Array<Array<{ type: string; name: string }>>;
  qishu?: { season?: string[]; fighting?: string[]; Decrypt?: string[] };
  tuningAdvice: ApiTuningAdvice;
}

interface TuningAssistantReportProps {
  equipments: Equipment[];
  plan: Plan | null;
  rolePanelData?: RolePanelData | null;
  defaultFlowType?: string;
  xinfaNameMap?: Record<string, string> | null;
}

/* ------------------------------------------------------------------ */
/*  Flow-type configurations                                           */
/* ------------------------------------------------------------------ */

interface FlowConfig {
  name: string;
  suit: string;
  acrPanel: [number, number];
  criPanel: [number, number];
  bashPanel: [number, number];
  t0: string[];
  t1: string[];
  school: string;
  divinePriority: string[];
  divineAvoid: string[];
  dingyinRight: string;
  slotAdvice: Record<string, string>;
  notes: string[];
}

const FLOW_CONFIGS: Record<string, FlowConfig> = {
  '鸣金虹': {
    name: '鸣金虹',
    suit: '玉斗',
    acrPanel: [98, 100],
    criPanel: [38, 40],
    bashPanel: [40, 40],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大鸣金攻击'],
    school: '鸣金',
    divinePriority: ['剑武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: ['枪武学增伤'],
    dingyinRight: '无名剑法·蓄力技增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 易水歌+无名心法+威猛歌+千山法 或 凝神章+无名心法+威猛歌+千山法'],
  },
  '鸣金影': {
    name: '鸣金影',
    suit: '飞隼',
    acrPanel: [98, 100],
    criPanel: [46, 50],
    bashPanel: [37, 37],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大鸣金攻击'],
    school: '鸣金',
    divinePriority: ['剑武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: [],
    dingyinRight: '积矩九剑·流血增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 易水歌+剑气纵横+逐狼心经+凝神章 或 易水歌+剑气纵横+逐狼心经+断石之构'],
  },
  '破竹风': {
    name: '破竹风',
    suit: '燕归',
    acrPanel: [98, 100],
    criPanel: [68, 75],
    bashPanel: [10, 18],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大破竹攻击', '敏'],
    school: '破竹',
    divinePriority: ['对首领单位增伤', '绳镖武学增伤', '全武学增效', '双刀武学增伤'],
    divineAvoid: [],
    dingyinRight: '粟子游尘·鼠鼠增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 易水歌+极乐泣血+忘川绝响+心弥泥鱼 或 断石之构+极乐泣血+忘川绝响+心弥泥鱼'],
  },
  '破竹尘': {
    name: '破竹尘',
    suit: '连星',
    acrPanel: [98.5, 100],
    criPanel: [70, 75],
    bashPanel: [10, 13],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大破竹攻击', '敏', '最小外功攻击'],
    school: '破竹',
    divinePriority: ['伞武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: ['绳镖武学增伤'],
    dingyinRight: '醉梦游春·武学技增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 千营一呼+绳舟行木+易水歌+大唐歌 或 千营一呼+绳舟行木+易水歌+所恨年年'],
  },
  '裂石钧': {
    name: '裂石钧',
    suit: '断岳',
    acrPanel: [98.5, 100],
    criPanel: [70, 75],
    bashPanel: [10, 13],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大裂石攻击', '敏', '最小外功攻击'],
    school: '裂石',
    divinePriority: ['横刀武学增伤', '对首领单位增伤'],
    divineAvoid: ['全武学增效', '陌刀武学增伤'],
    dingyinRight: '陌刀武学增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 霜天白夜+易水歌+穿喉决+孤忠不辞 或 霜天白夜+易水歌+穿喉决+征人归'],
  },
  '裂石威': {
    name: '裂石威',
    suit: '时雨',
    acrPanel: [98.5, 100],
    criPanel: [70, 75],
    bashPanel: [10, 13],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大裂石攻击', '敏', '最小外功攻击'],
    school: '裂石',
    divinePriority: ['陌刀武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: ['枪武学增伤'],
    dingyinRight: '嗟夫刀法·蓄力技增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 山河绝韵+抗造大法+困兽心经+磐石诀 或 山河绝韵+抗造大法+易水歌+威猛歌'],
  },
  '牵丝玉': {
    name: '牵丝玉',
    suit: '烟柳',
    acrPanel: [99, 100],
    criPanel: [65, 70],
    bashPanel: [18, 21],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大牵丝攻击', '敏', '最小外功攻击'],
    school: '牵丝',
    divinePriority: ['伞武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: ['扇武学增伤'],
    dingyinRight: '九重春色·高频弹道增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 花上月令+纵地摘星+易水歌+春雷篇 或 花上月令+纵地摘星+易水歌+征人归'],
  },
  '牵丝霖': {
    name: '牵丝霖',
    suit: '浣花',
    acrPanel: [98, 100],
    criPanel: [70, 80],
    bashPanel: [10, 20],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大牵丝攻击', '敏', '最小外功攻击'],
    school: '牵丝',
    divinePriority: ['单体类奇术增伤', '单体控制类奇术增伤', '单体爆发类奇术增伤', '对首领单位增伤'],
    divineAvoid: [],
    dingyinRight: '明川药典·治疗技增疗',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 易水歌+君臣药+杏花不见+千丝蛊 或 易水歌+君臣药+杏花不见+怒斩马'],
  },
  '破竹鸢': {
    name: '破竹鸢',
    suit: '撼天',
    acrPanel: [98, 100],
    criPanel: [68, 75],
    bashPanel: [10, 18],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大破竹攻击', '敏'],
    school: '破竹',
    divinePriority: ['手甲武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: [],
    dingyinRight: '天志垂象·蓄力技增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 易水歌+扶摇直上+擒天势+三穷致知 或 易水歌+扶摇直上+擒天势+断石之构'],
  },
  '牵丝翊': {
    name: '牵丝翊',
    suit: '裁云',
    acrPanel: [99, 100],
    criPanel: [65, 70],
    bashPanel: [18, 21],
    t0: ['最大外功攻击', '劲', '势', '会心率', '精准率', '会意率'],
    t1: ['最大牵丝攻击', '敏', '最小外功攻击'],
    school: '牵丝',
    divinePriority: ['舞绫鼓武学增伤', '对首领单位增伤', '全武学增效'],
    divineAvoid: [],
    dingyinRight: '文动霓裳·特殊技增伤',
    slotAdvice: {
      '环': '首词条应选大外攻',
      '佩': '首词条应选大外攻',
      '主武器': '首词条应选大外攻或势',
      '副武器': '首词条应选大外攻或势',
      '冠胄': '首词条应选三率',
      '胸甲': '首词条应选三率',
      '胫甲': '首词条应选三率或劲',
      '腕甲': '首词条应选三率或劲',
    },
    notes: ['推荐心法: 相和歌+风知意+弦墨篇+易水歌 或 相和歌+风知意+弦墨篇+所恨年年'],
  },
};

const RATE_CAPS = {
  REAL_ACR_PROB: { min: 98, label: '精准' },
  REAL_CRI_PROB: { min: 140, max: 160, label: '会心' },
  REAL_BASH_PROB: { min: 0, max: 74, label: '会意', warnOverflow: true },
};

/* ------------------------------------------------------------------ */
/*  Affix scoring (大外攻 = 100 base)                                  */
/* ------------------------------------------------------------------ */

const AFFIX_SCORE_BASE: Record<string, number> = {
  '最大外功攻击': 100,
  '势': 100,
  '会心率': 100,
  '精准率': 100,
  '会意率': 100,
  '劲': 85,
  '敏': 30,
  '最小外功攻击': 10,
  '御': 5,
  '气血最大值': 0,
  '防御': 0,
  '外功防御': 0,
  '气血': 0,
  '增疗': -30,
  '治疗': -30,
};

const API_AFFIX_NAME_MAP: Record<string, string> = {
  '小外': '最小外功攻击',
  '大破竹': '最大破竹攻击',
  '大裂石': '最大裂石攻击',
  '大牵丝': '最大牵丝攻击',
  '大鸣金': '最大鸣金攻击',
};

const SCHOOL_AFFIX_MAP: Record<string, { major: string; minor: string }> = {
  '鸣金': { major: '最大鸣金攻击', minor: '最小鸣金攻击' },
  '裂石': { major: '最大裂石攻击', minor: '最小裂石攻击' },
  '破竹': { major: '最大破竹攻击', minor: '最小破竹攻击' },
  '牵丝': { major: '最大牵丝攻击', minor: '最小牵丝攻击' },
};

/* Xinfa (心法) ID to flow type detection mapping */
const XINFA_TO_FLOW: Record<string, string> = {
  '104': '鸣金虹',  // 无名心法
  '154': '鸣金影',  // 剑气纵横
  '451': '破竹风',  // 忘川绝响
  '501': '破竹尘',  // 千营一呼
  '551': '裂石钧',  // 霜天白夜
  '401': '裂石威',  // 山河绝韵
  '304': '牵丝玉',  // 花上月令
  '351': '牵丝霖',  // 君臣药
  '601': '破竹鸢',  // 扶摇直上
  '651': '牵丝翊',  // 相和歌
};

function detectFlowType(rolePanelData?: RolePanelData | null): string | null {
  if (!rolePanelData) return null;
  const xinfaSource = rolePanelData['combat_plan.xinfa_info'] || rolePanelData.xinfa_info;
  if (!xinfaSource || typeof xinfaSource !== 'object') return null;
  for (const idStr of Object.keys(xinfaSource)) {
    const flow = XINFA_TO_FLOW[idStr];
    if (flow) return flow;
  }
  return null;
}

function matchFlowByApi(
  rolePanelData: RolePanelData | null | undefined,
  apiData: Record<string, ApiFlowEntry> | null,
  xinfaNameMap: Record<string, string> | null | undefined,
): string | null {
  if (!rolePanelData || !apiData || !xinfaNameMap) return null;
  const xinfaSource = rolePanelData['combat_plan.xinfa_info'] || rolePanelData.xinfa_info;
  if (!xinfaSource || typeof xinfaSource !== 'object') return null;

  // Build id → name lookup from equipped xinfa
  const equippedNames = new Set<string>();
  for (const idStr of Object.keys(xinfaSource)) {
    const name = xinfaNameMap[idStr];
    if (name) equippedNames.add(name);
  }

  // Check each flow's signature xinfa names against equipped
  for (const [flowType, entry] of Object.entries(apiData)) {
    const commend = entry.xinfa?.commend;
    if (!commend) continue;
    for (const combo of commend) {
      if (combo.some(name => equippedNames.has(name))) return flowType;
    }
  }

  return null;
}

const DIVINE_AFFIX_NAMES = [
  '全武学增效', '对首领单位增伤',
  '剑武学增伤', '枪武学增伤', '伞武学增伤', '伞武学增效', '绳镖武学增伤',
  '双刀武学增伤', '横刀武学增伤', '陌刀武学增伤', '手甲武学增伤', '扇武学增伤', '扇武学增效',
  '单体类奇术增伤', '单体控制类奇术增伤', '单体爆发类奇术增伤',
];

function getAffixScore(name: string, flowConfig?: FlowConfig): number {
  // Per-flow T0 override
  if (flowConfig?.t0.some(t => name.includes(t) || t.includes(name))) return 100;
  // Per-flow T1 override
  if (flowConfig?.t1.some(t => name.includes(t) || t.includes(name))) return 85;

  // School-specific affix scoring
  if (flowConfig?.school) {
    const schoolMap = SCHOOL_AFFIX_MAP[flowConfig.school];
    if (schoolMap) {
      if (name === schoolMap.major) return 85;  // 大本属 = T1
      if (name === schoolMap.minor) return 10;  // 小本属 = trash
    }
  }

  // Non-matching school affixes are trash
  for (const [, map] of Object.entries(SCHOOL_AFFIX_MAP)) {
    if (name === map.major) return 5;
    if (name === map.minor) return 5;
  }

  // Divine affixes — scored based on their presence, not value
  if (DIVINE_AFFIX_NAMES.some(d => d === name)) return 0;

  return AFFIX_SCORE_BASE[name] ?? 30;
}

function getAffixTier(score: number): string {
  if (score >= 100) return 'T0';
  if (score >= 80) return 'T1';
  if (score >= 25) return 'T2';
  if (score >= 0) return '可用';
  return '垃圾';
}

function matchesAffix(actual: string, expected: string): boolean {
  if (actual.includes(expected) || expected.includes(actual)) return true;
  const alt = expected.endsWith('增伤') ? expected.replace('增伤', '增效')
    : expected.endsWith('增效') ? expected.replace('增效', '增伤')
    : null;
  return !!alt && (actual.includes(alt) || alt.includes(actual));
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TuningAssistantReport({ equipments, plan, rolePanelData, defaultFlowType, xinfaNameMap }: TuningAssistantReportProps) {
  const [selectedFlowType, setSelectedFlowType] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [switchingFlow, setSwitchingFlow] = useState(false);
  const [apiData, setApiData] = useState<Record<string, ApiFlowEntry> | null>(null);

  useEffect(() => {
    fetch('https://s.166.net/config/ds_h72/ai_transfer_tool.json')
      .then(r => r.json())
      .then(data => {
        if (data?.recommend) setApiData(data.recommend);
      })
      .catch(() => {});
  }, []);

  const resolvedFlowType = plan?.flow_type || defaultFlowType || selectedFlowType;
  const detectedFlowType = !plan && !defaultFlowType && !selectedFlowType
    ? (detectFlowType(rolePanelData) || matchFlowByApi(rolePanelData, apiData, xinfaNameMap))
    : null;

  useEffect(() => {
    if (!plan && !defaultFlowType && !selectedFlowType) {
      const detected = detectFlowType(rolePanelData) || matchFlowByApi(rolePanelData, apiData, xinfaNameMap);
      if (detected) {
        setSelectedFlowType(detected);
      } else if (rolePanelData) {
        setShowSelector(true);
      }
    }
  }, [rolePanelData, plan, defaultFlowType, selectedFlowType]);

  if (!resolvedFlowType && !showSelector) {
    const hasAnyData = equipments.length > 0 || rolePanelData;
    if (!hasAnyData) {
      return (
        <div className="text-center py-8 text-gray-400">
          <p>暂无装备数据，请先选择角色或绑定游戏账号。</p>
        </div>
      );
    }
    return (
      <div className="text-center py-8 text-gray-400">
        <p>正在识别流派...</p>
        <div className="mt-2 animate-spin inline-block w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showSelector || switchingFlow) {
    return (
      <FlowTypeSelector
        onSelect={(ft) => {
          setSelectedFlowType(ft);
          setShowSelector(false);
          setSwitchingFlow(false);
        }}
        onCancel={switchingFlow ? () => setSwitchingFlow(false) : undefined}
        detectedHint={detectedFlowType}
        isDetecting={!rolePanelData}
      />
    );
  }

  const reportData = analyzeEquipments(equipments, resolvedFlowType!, rolePanelData, apiData, xinfaNameMap);
  return <TuningReportView data={reportData} onSwitchFlow={() => setSwitchingFlow(true)} />;
}

/* ------------------------------------------------------------------ */
/*  Flow type selector                                                  */
/* ------------------------------------------------------------------ */

function FlowTypeSelector({
  onSelect,
  onCancel,
  detectedHint,
  isDetecting,
}: {
  onSelect: (ft: string) => void;
  onCancel?: () => void;
  detectedHint: string | null;
  isDetecting: boolean;
}) {
  const [selected, setSelected] = useState(detectedHint || FLOW_TYPES[0]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-200">选择流派</h2>
      {isDetecting ? (
        <div className="text-gray-400 text-sm">
          正在获取角色数据... 如果无法自动识别，请手动选择流派。
        </div>
      ) : onCancel ? (
        <div className="text-gray-400 text-sm">
          请选择要切换的流派：
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          无法从心法自动识别流派，请手动选择：
        </div>
      )}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
      >
        {FLOW_TYPES.map((ft) => (
          <option key={ft} value={ft}>{ft}</option>
        ))}
      </select>
      {detectedHint && (
        <div className="text-xs text-amber-400">
          检测到心法配置，可能是 {detectedHint} 流派。
        </div>
      )}
      <div className="flex gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition font-medium"
          >
            取消
          </button>
        )}
        <button
          onClick={() => onSelect(selected)}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
        >
          确认并查看调号建议
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analysis                                                           */
/* ------------------------------------------------------------------ */

function analyzeEquipments(
  dbEquipments: Equipment[],
  flowType: string,
  rolePanelData?: RolePanelData | null,
  apiTuningData?: Record<string, ApiFlowEntry> | null,
  xinfaNameMap?: Record<string, string> | null,
): TuningReportData {
  const flowConfig = FLOW_CONFIGS[flowType];
  const apiFlowEntry = apiTuningData?.[flowType];

  // Build recommended affix counts from API section2
  const recommendedCounts = new Map<string, number>();
  if (apiFlowEntry?.tuningAdvice?.section2?.tabs) {
    for (const tab of apiFlowEntry.tuningAdvice.section2.tabs) {
      const name = API_AFFIX_NAME_MAP[tab.name] || tab.name;
      if (!name.includes('神力')) recommendedCounts.set(name, parseInt(tab.num, 10) || 0);
    }
  }

  // Build slot advice from API section1
  const TAB_SLOT_MAP: Record<string, string[]> = {
    'main': ['主武器', '副武器'],
    'ring': ['环', '佩'],
    'head': ['冠胄', '胸甲'],
    'pants': ['胫甲', '腕甲'],
  };
  const apiSlotAdvice: Record<string, string> = {};
  if (apiFlowEntry?.tuningAdvice?.section1?.tabs) {
    for (const tab of apiFlowEntry.tuningAdvice.section1.tabs) {
      const slots = TAB_SLOT_MAP[tab.id];
      if (!slots) continue;
      const parts: string[] = [];
      for (const entry of tab.entries) {
        const label = entry.name === '首词条推荐' ? '首词条'
          : entry.name === '不同部分推荐词条搭配' ? '推荐'
          : entry.name === '定音推荐' ? '定音'
          : entry.name;
        parts.push(`${label}:${entry.desc.replace('外攻穿透', '外功穿透')}`);
      }
      const descs = parts.join(' · ');
      for (const slot of slots) apiSlotAdvice[slot] = descs;
    }
  }

  const attributeStats: Record<string, { count: number; totalValue: number }> = {};
  const equipmentAnalysis: EquipmentAnalysis[] = [];

  const filteredEquipments = dbEquipments.filter(e => e.slot !== '弓' && e.slot !== '射决');

  filteredEquipments.forEach(equip => {
    const affixes: EquipmentAnalysis['affixes'] = [];
    let totalScore = 0;

    equip.attributes?.forEach((attr, idx) => {
      if (!attr || !attr.name) return;

      const score = getAffixScore(attr.name, flowConfig);
      const tier = getAffixTier(score);

      totalScore += score;

      if (!attributeStats[attr.name]) {
        attributeStats[attr.name] = { count: 0, totalValue: 0 };
      }
      attributeStats[attr.name].count++;
      attributeStats[attr.name].totalValue += attr.value || 0;

      affixes.push({
        name: attr.name,
        value: attr.value || 0,
        rate: attr.rate || 0,
        quality: attr.quality || 3,
        isMax: attr.is_main || false,
        tier,
        score,
      });
    });

    const dingyinName = affixes.length > 0 ? affixes[affixes.length - 1].name : null;

    const recommended = affixes.filter(a => a.isMax);
    const finalScore = recommended.length > 0
      ? Math.round(recommended.reduce((s, a) => s + (a.rate || 0), 0) / recommended.length)
      : Math.min(100, Math.max(0, affixes.length > 0 ? totalScore / affixes.length : 0));

    const slotAdvice = apiSlotAdvice[equip.slot] || flowConfig?.slotAdvice[equip.slot] || '';

    equipmentAnalysis.push({
      name: equip.name,
      slot: equip.slot,
      suit: equip.suit_type || '',
      affixes,
      dingyin: dingyinName,
      score: finalScore,
      slotAdvice,
    });
  });

  // ---- Rate analysis ----

  const acrProb = Number(rolePanelData?.['ACR_PROB'] || 0);
  const criProb = Number(rolePanelData?.['CRI_PROB'] || 0);
  const bashProb = Number(rolePanelData?.['BASH_PROB'] || 0);
  const realAcr = Number(rolePanelData?.['REAL_ACR_PROB'] || acrProb);
  const realCri = Number(rolePanelData?.['REAL_CRI_PROB'] || criProb);
  const realBash = Number(rolePanelData?.['REAL_BASH_PROB'] || bashProb);

  const acrTarget = flowConfig
    ? `${flowConfig.acrPanel[0]}-${flowConfig.acrPanel[1]}%`
    : `${RATE_CAPS.REAL_ACR_PROB.min}%+`;
  const criTarget = flowConfig
    ? `${flowConfig.criPanel[0]}-${flowConfig.criPanel[1]}%`
    : `${RATE_CAPS.REAL_CRI_PROB.min}%+`;
  const bashTarget = flowConfig
    ? `${flowConfig.bashPanel[0]}-${flowConfig.bashPanel[1]}%`
    : `≤${RATE_CAPS.REAL_BASH_PROB.max}%`;

  const rates: RateData[] = [
    {
      name: '精准率(实际)', value: realAcr,
      isHealthy: realAcr >= RATE_CAPS.REAL_ACR_PROB.min,
      unit: '%', target: acrTarget,
    },
    {
      name: '会心率(实际)', value: realCri,
      isHealthy: realCri >= RATE_CAPS.REAL_CRI_PROB.min && realCri <= RATE_CAPS.REAL_CRI_PROB.max!,
      unit: '%', target: criTarget,
    },
    {
      name: '会意率(实际)', value: realBash,
      isHealthy: realBash <= RATE_CAPS.REAL_BASH_PROB.max,
      unit: '%', target: bashTarget,
    },
  ];

  const rawRates: RateData[] = flowConfig
    ? [
        {
          name: '精准率(面板)', value: acrProb,
          isHealthy: acrProb >= flowConfig.acrPanel[0],
          unit: '%', target: `${flowConfig.acrPanel[0]}-${flowConfig.acrPanel[1]}%`,
        },
        {
          name: '会心率(面板)', value: criProb,
          isHealthy: criProb >= flowConfig.criPanel[0] && criProb <= flowConfig.criPanel[1],
          unit: '%', target: `${flowConfig.criPanel[0]}-${flowConfig.criPanel[1]}%`,
        },
        {
          name: '会意率(面板)', value: bashProb,
          isHealthy: bashProb >= flowConfig.bashPanel[0] && bashProb <= flowConfig.bashPanel[1],
          unit: '%', target: `${flowConfig.bashPanel[0]}-${flowConfig.bashPanel[1]}%`,
        },
      ]
    : [];

  const minAtk = Number(rolePanelData?.['MIN_W_ATK'] || 0);
  const maxAtk = Number(rolePanelData?.['MAX_W_ATK'] || 0);
  const totalAtk = minAtk + maxAtk;

  const attacks: AttackData[] = [
    {
      name: '综合外攻（最小+最大）',
      current: totalAtk > 0 ? String(totalAtk) : '暂无数据',
      isHealthy: totalAtk >= 5600,
      note: totalAtk >= 6500 ? '完美' : totalAtk >= 6000 ? '优秀' : totalAtk >= 5600 ? '及格' : totalAtk > 0 ? `建议提升至8000+` : '请从游戏获取角色面板',
    },
  ];

  // Normalize API affix names to game names
  const apiNameToGame = (s: string) => s.replace('外攻穿透', '外功穿透');

  // ---- Dingyin targets from API section1 ----
  const dingyinTargets: Record<string, string> | null = (() => {
    if (!apiFlowEntry?.tuningAdvice?.section1?.tabs) return null;
    const TAB_SLOT_MAP: Record<string, string[]> = {
      'main': ['主武器', '副武器'],
      'ring': ['环', '佩'],
      'head': ['冠胄', '胸甲'],
      'pants': ['胫甲', '腕甲'],
    };
    const targets: Record<string, string> = {};
    for (const tab of apiFlowEntry.tuningAdvice.section1.tabs) {
      const slots = TAB_SLOT_MAP[tab.id];
      if (!slots) continue;
      const entry = tab.entries.find(e => e.name === '定音推荐');
      if (!entry) continue;
      for (const slot of slots) targets[slot] = apiNameToGame(entry.desc);
    }
    if (flowType === '牵丝玉') {
      ['冠胄', '胸甲', '胫甲', '腕甲'].forEach(slot => {
        targets[slot] = '九重春色·高频弹道增伤';
      });
    }
    return Object.keys(targets).length > 0 ? targets : null;
  })();

  const weaponDingyin = analyzeDingyin(equipmentAnalysis, flowConfig, '左', dingyinTargets);
  const armorDingyin = analyzeDingyin(equipmentAnalysis, flowConfig, '右', dingyinTargets);

  const divineAffixes: AffixSummary[] = (flowConfig?.divinePriority || DIVINE_AFFIX_NAMES.slice(0, 3)).map(name => {
    const nameVariants = name.endsWith('增伤') ? [name, name.replace('增伤', '增效')]
      : name.endsWith('增效') ? [name, name.replace('增效', '增伤')]
      : [name];
    const combinedCount = nameVariants.reduce((sum, n) => sum + (attributeStats[n]?.count || 0), 0);
    const combinedValue = nameVariants.reduce((sum, n) => sum + (attributeStats[n]?.totalValue || 0), 0);
    const isAvoid = flowConfig?.divineAvoid.some(a => a.includes(name)) ?? false;
    let status: AffixSummary['status'];
    let note: string;
    if (isAvoid) {
      status = combinedCount > 0 ? '注意' : '良好';
      note = combinedCount > 0 ? '此流派应避免该词条' : '已规避（推荐）';
    } else if (combinedCount >= 2) {
      status = '完美';
      note = '已满配';
    } else if (combinedCount >= 1) {
      status = '良好';
      note = '已有1条，建议补充至2条';
    } else {
      status = '不足';
      note = '建议补充';
    }
    return { name, count: combinedCount, totalValue: combinedValue, status, note };
  });

  // ---- Affix summary ----

  const importantAffixes = [
    '最大外功攻击', '劲', '势', '会心率', '精准率', '会意率',
    '外功穿透', '敏',
  ];

  if (flowConfig?.school) {
    const schoolMap = SCHOOL_AFFIX_MAP[flowConfig.school];
    if (schoolMap) importantAffixes.push(schoolMap.major);
  }

  // Include API-only affixes (e.g. 最小外功攻击 for 裂石钧)
  recommendedCounts.forEach((_, apiName) => {
    if (!importantAffixes.includes(apiName)) importantAffixes.push(apiName);
  });

  const affixSummary: AffixSummary[] = importantAffixes.map(name => {
    const stat = attributeStats[name];
    const count = stat?.count || 0;
    const totalValue = stat?.totalValue || 0;
    const score = getAffixScore(name, flowConfig);
    let status: AffixSummary['status'];
    let note: string;

    const targetCount = recommendedCounts.get(name);
    const hasApiData = !!apiFlowEntry?.tuningAdvice?.section2?.tabs;
    if (targetCount && targetCount > 0) {
      if (count >= targetCount) { status = '完美'; note = `已满配(${count}/${targetCount})`; }
      else if (count >= Math.ceil(targetCount * 0.75)) { status = '优秀'; note = `接近满配(${count}/${targetCount})`; }
      else if (count >= Math.ceil(targetCount * 0.5)) { status = '良好'; note = `可优化至${targetCount}条`; }
      else if (count > 0) { status = '注意'; note = `建议补充至${targetCount}条`; }
      else { status = '不足'; note = `建议补充${targetCount}条`; }
    } else if (hasApiData && !recommendedCounts.has(name) && name !== '外功穿透') {
      if (count === 0) { status = '完美'; note = '该流派不需要此词条'; }
      else { status = '注意'; note = '该流派不需要此词条，建议洗掉'; }
    } else if (score <= 5) {
      status = count === 0 ? '良好' : '注意';
      note = count === 0 ? '已规避' : '建议洗掉';
    } else if (name.includes('外功') && name !== '外功穿透') {
      if (count >= 8) { status = '完美'; note = '已达满配'; }
      else if (count >= 6) { status = '优秀'; note = '接近满配'; }
      else if (count >= 4) { status = '良好'; note = '可继续优化'; }
      else { status = '注意'; note = '建议补充'; }
    } else if (name === '劲') {
      if (count >= 6) { status = '完美'; note = '已达满配'; }
      else if (count >= 4) { status = '优秀'; note = '接近满配'; }
      else { status = '注意'; note = '建议补充至4-6条'; }
    } else if (name === '势') {
      if (count >= 4) { status = '完美'; note = '充足'; }
      else if (count >= 2) { status = '良好'; note = '已有'; }
      else { status = '注意'; note = '建议补充'; }
    } else if (name === '敏') {
      if (count >= 3) { status = '优秀'; note = '充足'; }
      else if (count >= 1) { status = '良好'; note = '已有'; }
      else { status = '注意'; note = '可慢慢优化'; }
    } else if (name === '外功穿透') {
      if (count >= 1) { status = '完美'; note = '已拥有'; }
      else { status = '不足'; note = '左边定音缺失'; }
    } else if (name.includes('最大')) {
      if (count >= 4) { status = '完美'; note = '充足'; }
      else if (count >= 2) { status = '良好'; note = '已有'; }
      else { status = '注意'; note = '建议补充'; }
    } else {
      if (totalValue >= (name === '会心率' ? 60 : name === '精准率' ? 98 : 40)) {
        status = '完美'; note = '已达标';
      } else if (totalValue >= (name === '会心率' ? 40 : name === '精准率' ? 80 : 30)) {
        status = '良好'; note = '接近达标';
      } else {
        status = '注意'; note = '建议补充';
      }
    }

    return { name, count, totalValue, status, note };
  });

  // ---- Suit check ----

  const wearingEquipments = dbEquipments.filter(e => e.is_wearing);
  const suitCounts: Record<string, number> = {};
  wearingEquipments.forEach(e => {
    if (e.suit_type) {
      suitCounts[e.suit_type] = (suitCounts[e.suit_type] || 0) + 1;
    }
  });
  const currentSuit = Object.entries(suitCounts)
    .filter(([, c]) => c >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => `${name}(${count}件)`)
    .join(', ') || '无套装';
  const isSuitMatch = flowConfig ? Object.keys(suitCounts).some(s => s.includes(flowConfig.suit)) : true;

  const suitStatus = {
    recommended: flowConfig?.suit || '未知',
    current: currentSuit,
    isMatch: isSuitMatch,
  };

  // ---- Xinfa check ----
  let xinfaCheck: XinfaCheckResult | null = null;
  if (rolePanelData && apiFlowEntry?.xinfa?.commend?.length && xinfaNameMap) {
    const xinfaSource = rolePanelData['combat_plan.xinfa_info'] || rolePanelData.xinfa_info;
    if (xinfaSource && typeof xinfaSource === 'object') {
      const equippedXinfa = Object.entries(xinfaSource)
        .map(([id]) => ({ id, name: xinfaNameMap[id] || id }));
      const recommendedSets = apiFlowEntry.xinfa.commend;
      const checked = equippedXinfa.map(x => ({
        ...x,
        isCorrect: recommendedSets.some(set => set.includes(x.name)),
      }));
      const equippedNames = checked.map(x => x.name);
      const allRecommended = recommendedSets.flat();
      const missing = allRecommended.filter((n, i, arr) => arr.indexOf(n) === i).filter(n => !equippedNames.includes(n));
      xinfaCheck = { equipped: checked, missing, recommendedSets };
    }
  }

  // ---- Recommendations ----
  const apiTips = apiFlowEntry?.tuningAdvice?.section3?.tips || [];
  const recommendations = generateRecommendations({
    attributeStats, totalAtk, equipmentAnalysis, rates, rawRates, flowConfig,
    weaponDingyin, armorDingyin, suitStatus, apiTips,
  });

  // ---- Summary ----
  const goodCount = affixSummary.filter(a => a.status === '完美' || a.status === '优秀').length;
  const totalCount = affixSummary.length;
  const summary = goodCount === totalCount
    ? '装备状态很棒！全身无需要替换的歪词条。'
    : `${goodCount}/${totalCount} 个关键词条达到优秀以上状态，建议继续优化其余词条。`;

  return {
    characterName: String(rolePanelData?.['base.nickname'] || ''),
    flowType,
    version: flowConfig?.name || flowType,
    rates,
    rawRates,
    attacks,
    divineAffixes,
    weaponDingyin,
    armorDingyin,
    affixSummary,
    equipmentAnalysis,
    summary,
    recommendations,
    suitStatus,
    xinfaCheck,
    dingyinTargets: dingyinTargets || undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Dingyin analysis                                                   */
/* ------------------------------------------------------------------ */

function analyzeDingyin(
  equipmentAnalysis: EquipmentAnalysis[],
  flowConfig: FlowConfig | undefined,
  side: '左' | '右',
  dingyinTargets?: Record<string, string> | null,
) {
  const leftSlots = ['主武器', '副武器', '环', '佩'];
  const rightSlots = ['冠胄', '胸甲', '胫甲', '腕甲'];
  const targetSlots = side === '左' ? leftSlots : rightSlots;

  // Collect dingyin (last affix) for each slot
  const dingyinBySlot: Record<string, string> = {};
  equipmentAnalysis.forEach(eq => {
    const dingyin = eq.affixes.length > 0 ? eq.affixes[eq.affixes.length - 1].name : null;
    if (dingyin) dingyinBySlot[eq.slot] = dingyin;
  });

  let okCount = 0;
  let totalCount = 0;
  const details: string[] = [];
  const uniqueExpected = new Set<string>();

  targetSlots.forEach(slot => {
    const d = dingyinBySlot[slot];
    if (!d) return;
    totalCount++;

    // Use per-slot dingyin target from API when available
    const expected = dingyinTargets?.[slot] || (side === '左' ? '外功穿透' : flowConfig?.dingyinRight || '');
    if (!expected) return;
    uniqueExpected.add(expected);

    const isOk = matchesAffix(d, expected);
    if (isOk) okCount++;
    details.push(`${slot}:${d}${isOk ? ' ✅' : ' ❌'}`);
  });

  const status = details.length === 0 ? '注意' : okCount === totalCount ? '完美' : okCount > 0 ? '良好' : '注意';
  const requiredAffix = Array.from(uniqueExpected).join('/');

  return {
    status,
    text: `定音${side === '左' ? '左' : '右'}边推荐${requiredAffix} ${okCount}/${totalCount}${details.length > 0 ? '\n' + details.join('\n') : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Recommendations                                                    */
/* ------------------------------------------------------------------ */

interface RecContext {
  attributeStats: Record<string, { count: number; totalValue: number }>;
  totalAtk: number;
  equipmentAnalysis: EquipmentAnalysis[];
  rates: RateData[];
  rawRates: RateData[];
  flowConfig: FlowConfig | undefined;
  weaponDingyin: { status: string; text: string };
  armorDingyin: { status: string; text: string };
  suitStatus: { recommended: string; current: string; isMatch: boolean };
  apiTips?: Array<{ title: string; content: string }>;
}

function generateRecommendations(ctx: RecContext): Recommendation[] {
  const {
    attributeStats, totalAtk, equipmentAnalysis, rates, rawRates,
    flowConfig, weaponDingyin, armorDingyin, suitStatus, apiTips,
  } = ctx;
  const recommendations: Recommendation[] = [];

  // ---- Suit check ----
  if (flowConfig && !suitStatus.isMatch) {
    recommendations.push({
      title: '套装检查',
      content: `推荐套装为【${flowConfig.suit}】，当前${suitStatus.current}。请优先凑齐${flowConfig.suit}套效果。`,
    });
  }

  // ---- 三率 check (actual rates vs caps) ----
  const realAcrRate = rates.find(r => r.name === '精准率(实际)');
  const realCriRate = rates.find(r => r.name === '会心率(实际)');
  const realBashRate = rates.find(r => r.name === '会意率(实际)');

  if (realAcrRate && !realAcrRate.isHealthy) {
    recommendations.push({
      title: '精准率不足（实际）',
      content: `实际精准率 ${realAcrRate.value.toFixed(1)}%，需要达到 ${RATE_CAPS.REAL_ACR_PROB.min}% 以上。最高优先级，必须达标。`,
    });
  }
  if (realCriRate && !realCriRate.isHealthy) {
    if (realCriRate.value < RATE_CAPS.REAL_CRI_PROB.min) {
      recommendations.push({
        title: '会心率不足（实际）',
        content: `实际会心率 ${realCriRate.value.toFixed(1)}%，需要达到 ${RATE_CAPS.REAL_CRI_PROB.min}% 以上。`,
      });
    } else {
      recommendations.push({
        title: '会心率超阈值（实际）',
        content: `实际会心率 ${realCriRate.value.toFixed(1)}%，当前版本极限约160%，注意不要溢出太多。`,
      });
    }
  }
  if (realBashRate && !realBashRate.isHealthy && realBashRate.value > RATE_CAPS.REAL_BASH_PROB.max) {
    recommendations.push({
      title: '会意率溢出（实际）',
      content: `实际会意率 ${realBashRate.value.toFixed(1)}%，超过阈值${RATE_CAPS.REAL_BASH_PROB.max}%，容易溢出。建议减少会意词条，换成其他属性。`,
    });
  }

  // ---- Panel rate check (flow-specific targets) ----
  if (flowConfig) {
    const panelAcr = rawRates.find(r => r.name === '精准率(面板)');
    const panelCri = rawRates.find(r => r.name === '会心率(面板)');
    const panelBash = rawRates.find(r => r.name === '会意率(面板)');
    const missingPanel: string[] = [];
    if (panelAcr && !panelAcr.isHealthy) missingPanel.push(`精准率(${panelAcr.value.toFixed(1)}%)`);
    if (panelCri && !panelCri.isHealthy) missingPanel.push(`会心率(${panelCri.value.toFixed(1)}%)`);
    if (panelBash && !panelBash.isHealthy) missingPanel.push(`会意率(${panelBash.value.toFixed(1)}%)`);
    if (missingPanel.length > 0) {
      recommendations.push({
        title: `三率词条优化（${flowConfig.name}）`,
        content: `面板${missingPanel.join('、')}未达到流派目标。请通过装备词条调整。`,
      });
    }
  }

  // ---- 外攻 ----
  if (totalAtk > 0 && totalAtk < 5600) {
    recommendations.push({
      title: '外攻不足',
      content: `当前外攻约${totalAtk}，未达到5600及格线，建议优先补大外攻(最大外功攻击)词条，目标8000+。环和佩应选大外攻为首词条。`,
    });
  } else if (totalAtk >= 5600 && totalAtk < 6000) {
    recommendations.push({
      title: '外攻及格',
      content: `当前外攻约${totalAtk}，已过及格线，继续提升至6000+达到优秀标准。`,
    });
  } else if (totalAtk >= 6000 && totalAtk < 6500) {
    recommendations.push({
      title: '外攻优秀',
      content: `当前外攻约${totalAtk}，已达优秀标准，可冲刺6500+完美。`,
    });
  } else if (totalAtk >= 6500) {
    recommendations.push({
      title: '外攻完美',
      content: `当前外攻约${totalAtk}，已达完美标准！`,
    });
  }

  // ---- 劲 ----
  const jinCount = attributeStats['劲']?.count || 0;
  if (jinCount < 4) {
    recommendations.push({
      title: '劲词条不足',
      content: `当前劲词条${jinCount}条，建议补充至4-6条。胫甲和腕甲优先选三率或劲。`,
    });
  }

  // ---- 势 ----
  const shiCount = attributeStats['势']?.count || 0;
  if (shiCount < 2) {
    recommendations.push({
      title: '势词条不足',
      content: `当前势词条${shiCount}条，建议补充2-4条。武器可选势为首词条。`,
    });
  }

  // ---- Dingyin ----
  if (weaponDingyin.status !== '完美') {
    recommendations.push({
      title: '定音左边检查',
      content: weaponDingyin.text,
    });
  }
  if (armorDingyin.status !== '完美') {
    recommendations.push({
      title: '定音右边检查',
      content: armorDingyin.text,
    });
  }

  // ---- 大本属（school major affix） ----
  if (flowConfig?.school) {
    const schoolMap = SCHOOL_AFFIX_MAP[flowConfig.school];
    if (schoolMap) {
      const majorCount = attributeStats[schoolMap.major]?.count || 0;
      if (majorCount < 2) {
        recommendations.push({
          title: `${schoolMap.major}不足`,
          content: `当前${schoolMap.major}词条${majorCount}条，建议补充2-4条以提高本属伤害。`,
        });
      }
    }
  }

  // ---- Low-score equipment ----
  const badEquipments = equipmentAnalysis.filter(e => e.score < 60);
  if (badEquipments.length > 0) {
    recommendations.push({
      title: '低分装备检查',
      content: `以下装备评分较低，建议洗练或替换：\n${badEquipments.map(e =>
        `${e.name}(${e.slot}) - ${Math.round(e.score)}分${e.slotAdvice ? ' · ' + e.slotAdvice : ''}`,
      ).join('\n')}`,
    });
  }

  // ---- Slot-specific advice ----
  const slotsNeedingAdvice = equipmentAnalysis.filter(e =>
    e.slotAdvice && e.score < 70,
  );
  if (slotsNeedingAdvice.length > 0) {
    recommendations.push({
      title: '部位调律提醒',
      content: slotsNeedingAdvice.map(e => `${e.name}(${e.slot}): ${e.slotAdvice}`).join('\n'),
    });
  }

  // ---- Divine priority check ----
  if (flowConfig) {
    const foundDivines = equipmentAnalysis
      .flatMap(e => e.affixes)
      .filter(a => DIVINE_AFFIX_NAMES.some(d => a.name.includes(d)))
      .map(a => a.name);
    const avoidFound = foundDivines.filter(name =>
      flowConfig.divineAvoid.some(a => name.includes(a)),
    );
    if (avoidFound.length > 0) {
      recommendations.push({
        title: '不推荐的神力词条',
        content: `此流派应避免: ${avoidFound.join(', ')}，建议洗掉。`,
      });
    }
    const priorityMissing = flowConfig.divinePriority.filter(p => {
      const variants = p.endsWith('增伤') ? [p, p.replace('增伤', '增效')]
        : p.endsWith('增效') ? [p, p.replace('增效', '增伤')]
        : [p];
      return !foundDivines.some(f => variants.some(v => f.includes(v)));
    });
    if (priorityMissing.length > 0) {
      recommendations.push({
        title: '神力词条优先级',
        content: `推荐顺序: ${flowConfig.divinePriority.join(' > ')}。缺失: ${priorityMissing.join('、')}`,
      });
    }
  }

  // ---- 低词条率 checking ----
  const lowRateAffixes: { name: string; rate: number; equip: string; tier: string }[] = [];
  equipmentAnalysis.forEach(equip => {
    equip.affixes.forEach(affix => {
      if ((affix.tier === 'T0' || affix.tier === 'T1') && affix.rate > 0 && affix.rate < 90) {
        lowRateAffixes.push({ name: affix.name, rate: affix.rate, equip: equip.name, tier: affix.tier });
      }
    });
  });
  if (lowRateAffixes.length > 0) {
    recommendations.push({
      title: '低数值关键词条',
      content: `以下重要词条数值较低，建议洗练提升数值：\n${lowRateAffixes.slice(0, 6).map(a =>
        `${a.name} - ${a.rate.toFixed(1)}% (${a.equip})`,
      ).join('\n')}`,
    });
  }

  // ---- Flow notes ----
  if (flowConfig?.notes && flowConfig.notes.length > 0 && recommendations.length < 8) {
    recommendations.push({
      title: `${flowConfig.name}提醒`,
      content: flowConfig.notes.join('\n'),
    });
  }

  // ---- API tuning tips ----
  if (apiTips && apiTips.length > 0 && recommendations.length < 10) {
    recommendations.push({
      title: '官方调律小技巧',
      content: apiTips.map(t => `${t.title}: ${t.content}`).join('\n'),
    });
  }

  return recommendations;
}

/* ------------------------------------------------------------------ */
/*  View                                                                */
/* ------------------------------------------------------------------ */

function TuningReportView({ data, onSwitchFlow }: { data: TuningReportData; onSwitchFlow?: () => void }) {
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

  const progressColor = (value: number, healthy: boolean, warnOverflow = false) => {
    if (healthy) return 'bg-green-400';
    if (warnOverflow && value > 74) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {(data.characterName || data.flowType) && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">
              👤 {data.characterName || '未知角色'}
            </h2>
            <button
              onClick={onSwitchFlow}
              className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              切换
            </button>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {data.flowType} · {data.version}
          </div>
        </div>
      )}

      {/* 三率概览 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 inline-flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> 三率概览（实际）</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {data.rates.map((rate, index) => {
            const isOverflow = rate.name === '会意率(实际)' && rate.value > 74;
            return (
              <div key={index} className={`p-3 rounded-lg ${rate.isHealthy ? 'bg-green-500/10' : isOverflow ? 'bg-orange-500/10' : 'bg-red-500/10'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400 text-sm">{rate.name}</span>
                  {rate.target && <span className="text-gray-500 text-xs">目标:{rate.target}</span>}
                </div>
                <div className={`text-xl font-bold ${rate.isHealthy ? 'text-green-400' : isOverflow ? 'text-orange-400' : 'text-red-400'}`}>
                  {rate.value.toFixed(1)}{rate.unit}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${progressColor(rate.value, rate.isHealthy, isOverflow)}`}
                    style={{ width: `${Math.min(rate.value, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {data.rawRates.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-gray-400 mb-2">流派目标（面板值）</h3>
            <div className="grid grid-cols-3 gap-2">
              {data.rawRates.map((rate, index) => (
                <div key={index} className={`p-2 rounded-lg text-center ${rate.isHealthy ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  <div className="text-xs text-gray-400">{rate.name}</div>
                  <div className={`text-sm font-bold ${rate.isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                    {rate.value.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 总外攻 */}
        {data.attacks.map((attack, index) => (
          <div key={index} className={`mt-3 p-3 rounded-lg ${attack.isHealthy ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
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

      {/* 套装状态 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 inline-flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg> 套装</h2>
        <div className={`p-3 rounded-lg ${data.suitStatus.isMatch ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">推荐: {data.suitStatus.recommended}</span>
            <span className={`font-bold text-sm ${data.suitStatus.isMatch ? 'text-green-400' : 'text-yellow-400'}`}>
              {data.suitStatus.isMatch ? '✅ 已匹配' : '❌ 未匹配'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">当前: {data.suitStatus.current}</div>
        </div>
      </div>

      {/* 心法检查 */}
      {data.xinfaCheck && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">📖 心法检查</h2>
          <div className="mb-3">
            <div className="text-sm text-gray-400 mb-2">推荐心法组合：</div>
            {data.xinfaCheck.recommendedSets.map((set, i) => (
              <div key={i} className="flex flex-wrap gap-1 mb-1">
                {set.map((name, j) => (
                  <span key={j} className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">{name}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="mb-3">
            <div className="text-sm text-gray-400 mb-2">当前装备心法：</div>
            <div className="flex flex-wrap gap-2">
              {data.xinfaCheck.equipped.map((x, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded text-sm ${
                    x.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {x.name} {x.isCorrect ? '✅' : '❌'}
                </span>
              ))}
            </div>
          </div>
          {data.xinfaCheck.missing.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-1">建议替换为以下心法：</div>
              <div className="flex flex-wrap gap-1">
                {data.xinfaCheck.missing.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 定音分析 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">⚔️ 定音分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${getStatusBg(data.weaponDingyin.status)}`}>
            <div className="text-gray-400 text-sm">定音左边（主/副/环/佩）</div>
            <div className={`font-bold text-sm whitespace-pre-line ${getStatusColor(data.weaponDingyin.status)}`}>
              {data.weaponDingyin.text}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${getStatusBg(data.armorDingyin.status)}`}>
            <div className="text-gray-400 text-sm">定音右边（冠/胸/胫/腕）</div>
            <div className={`font-bold text-sm whitespace-pre-line ${getStatusColor(data.armorDingyin.status)}`}>
              {data.armorDingyin.text}
            </div>
          </div>
        </div>
      </div>

      {/* 神力词条 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 inline-flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> 神力词条统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.divineAffixes.map((affix, index) => (
            <div key={index} className={`p-3 rounded-lg ${getStatusBg(affix.status)}`}>
              <div className="text-gray-400 text-xs truncate" title={affix.name}>{affix.name}</div>
              <div className={`font-bold ${getStatusColor(affix.status)}`}>
                {affix.count > 0 ? `${affix.count}条` : '缺失'}
              </div>
              {affix.note && <div className="text-[10px] text-gray-500 mt-0.5">{affix.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 词条统计 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">📈 关键词条统计</h2>
        <div className="space-y-1.5">
          {data.affixSummary.map((affix, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-300 text-sm truncate">{affix.name}</span>
                <span className="text-gray-500 text-xs shrink-0">x{affix.count}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBg(affix.status)} ${getStatusColor(affix.status)}`}>
                  {affix.status}
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline">{affix.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 装备分析 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 inline-flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> 装备分析</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.equipmentAnalysis.map((equip, index) => {
            const leftSlots = ['主武器', '副武器', '环', '佩'];
            const dingyinExpected = data.dingyinTargets?.[equip.slot]
              || (leftSlots.includes(equip.slot) ? '外功穿透' : undefined);
            const isDingyinCorrect = equip.dingyin && dingyinExpected
              && matchesAffix(equip.dingyin, dingyinExpected);
            return (
            <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="min-w-0">
                  <span className="text-gray-200 font-medium text-sm">{equip.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{equip.slot}</span>
                  {equip.suit && <span className="text-amber-400 text-xs ml-2">{equip.suit}</span>}
                </div>
<span className={`text-sm font-bold shrink-0 ${getScoreColor(equip.score)}`}>
  {Math.round(equip.score)}分
</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {equip.affixes.map((affix, i) => {
                  const isLast = i === equip.affixes.length - 1;
                  const affixColor = getScoreColor(affix.rate);
                  return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                      affix.tier === 'T0' ? 'bg-green-500/20' :
                      affix.tier === 'T1' ? 'bg-blue-500/20' :
                      affix.tier === '垃圾' ? 'bg-red-500/20' :
                      'bg-gray-600/50'
                    } ${affixColor} ${isLast ? 'ring-1 ring-purple-400/50' : ''}`}
                    title={`${affix.name}: ${affix.value} (${affix.rate.toFixed(1)}%/Lv${affix.quality})`}
                  >
                    {affix.isMax && <span className="text-amber-400 mr-0.5 text-[10px]">荐</span>}
                    {affix.name}
                    {affix.rate > 0 && (
                      <span className={`text-[10px] ${affixColor}`}>{Math.round(affix.rate)}%</span>
                    )}
                  </span>
                )})}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {equip.dingyin && (
                  <span className={isDingyinCorrect ? 'text-green-400' : 'text-red-400'}>
                    定音: {equip.dingyin}
                    {dingyinExpected ? (isDingyinCorrect ? ' ✅' : ` ❌ (应选${dingyinExpected})`) : ''}
                  </span>
                )}
                {equip.slotAdvice && (
                  <span className="text-amber-400/70">{equip.slotAdvice}</span>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* 调律建议 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 inline-flex items-center gap-1.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> 调律建议</h2>
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

      {/* Summary */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className={`text-center py-2 ${data.summary.includes('很棒') ? 'text-green-400' : 'text-yellow-400'}`}>
          <strong>{data.summary}</strong>
        </div>
      </div>
    </div>
  );
}
