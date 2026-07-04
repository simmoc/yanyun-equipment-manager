import type { Equipment, RolePanelData } from '@/types';

// ============================================================
// 类型定义
// ============================================================

export interface FlowConfigData {
  flows: Record<string, {
    element: string;
    baseline: number;
    battle_time: number;
    default_set?: string;
    weapons?: string[];
    version?: string;
    author?: string;
    rotation_key?: string;
    skill_key?: string;
  }>;
  season_stats: Record<string, number>;
  set_bonuses?: Record<string, Record<string, number>>;
  base_stats?: Record<string, number>;
  weapon_types?: Record<string, string>;
}

export interface FlowRotationAction {
  name: string;
  count: number;
  isDingyin: boolean;
  generalBonus?: number;
  yishui?: number;
  tiaozhan?: number;
  included?: boolean;
}

export interface FlowRotationData {
  rotation: FlowRotationAction[];
}

export interface FlowSkillData {
  outerRatio: number;
  eleRatio: number;
  fixed: number;
  element?: string;
  weaponType?: string;
  type?: string;
  exDmg?: number;
  exCritDmg?: number;
  exIntent?: number;
  exIntentDmg?: number;
  exPen?: number;
  isCharge?: number;
  exMinATK?: number;
  exMaxATK?: number;
  exATK?: number;
  special?: string;
  force?: string;
  modifiers?: Record<string, number>;
}

export interface PlayerStats {
  // 外功
  minOuter: number;
  maxOuter: number;
  avgOuter: number;
  // 属性
  elementAttacks: Record<string, { min: number; max: number; avg: number }>;
  // 三率
  preciseRate: number;
  critRate: number;
  intentRate: number;
  directCritRate: number;
  directIntentRate: number;
  // 穿透
  outerPen: number;
  elemPen: number;
  // 伤害加成
  outerDmgBonus: number;
  elemDmgBonus: number;
  critDmgBonus: number;
  intentDmgBonus: number;
  // 神力词条
  bossDmgBonus: number;
  allArtsBonus: number;
  schoolBonuses: Record<string, number>;
  specialDmgBonus: number;
  // 元素额外加成
  elementBonuses: Record<string, number>;
}

export interface SkillDamageBreakdown {
  name: string;
  count: number;
  singleDamage: number;
  totalDamage: number;
  weaponBonus: number;
  hitExpectation: number;
  isDingyin: boolean;
  generalBonus: number;
  outerPart: number;
  elePart: number;
  fixedPart: number;
}

export interface GraduationCalcResult {
  flowType: string;
  element: string;
  baseline: number;
  battleTime: number;
  totalDamage: number;
  graduationRate: number;
  adps: number;
  skillBreakdown: SkillDamageBreakdown[];
  playerStats: PlayerStats;
  missingData: string[];
}

// ============================================================
// 常量配置
// ============================================================

const ELEMENT_FIELD_MAP: Record<string, { min: string; max: string }> = {
  '鸣金': { min: 'MIN_PRO_ATK_A', max: 'MAX_PRO_ATK_A' },
  '裂石': { min: 'MIN_PRO_ATK_C', max: 'MAX_PRO_ATK_C' },
  '牵丝': { min: 'MIN_PRO_ATK_B', max: 'MAX_PRO_ATK_B' },
  '破竹': { min: 'MIN_PRO_ATK_E', max: 'MAX_PRO_ATK_E' },
  '无相': { min: 'MIN_ACTIVE_PRO_ATK', max: 'MAX_ACTIVE_PRO_ATK' },
};

// 武器类型 → 武学增效字段映射
const WEAPON_BONUS_MAP: Record<string, string> = {
  '剑': '剑武学增效',
  '枪': '枪武学增效',
  '伞': '伞武学增效',
  '扇': '扇武学增效',
  '绳标': '绳标武学增效',
  '双刀': '双刀武学增效',
  '陌刀': '陌刀武学增效',
  '横刀': '横刀武学增效',
  '拳甲': '拳甲武学增效',
};

// ============================================================
// 工具函数
// ============================================================

function safeNum(val: any, def = 0): number {
  if (val === null || val === undefined || val === '') return def;
  const n = Number(val);
  return isFinite(n) ? n : def;
}

// 从面板读取百分比属性（如 "24.5" 表示 24.5%，转为小数 0.245）
function readPct(panel: Record<string, any>, field: string): number {
  return safeNum(panel[field]) / 100;
}

// 从装备中提取神力词条
function extractDivineFromEquipments(
  equipments: Equipment[]
): {
  bossDmgBonus: number;
  allArtsBonus: number;
  schoolBonuses: Record<string, number>;
  specialDmgBonus: number;
} {
  let bossDmgBonus = 0;
  let allArtsBonus = 0;
  const schoolBonuses: Record<string, number> = {};
  let specialDmgBonus = 0;

  for (const equip of equipments) {
    if (!equip.is_wearing || !equip.attributes) continue;
    for (const attr of equip.attributes) {
      const name = attr.name || '';
      const value = attr.value || 0;

      // 对首领单位增伤
      if (name.includes('对首领单位增伤')) {
        bossDmgBonus += value;
      }
      // 全武学增效
      else if (name.includes('全武学增效')) {
        allArtsBonus += value;
      }
      // 武学增伤 / 武学增效 门派类（剑、枪、伞、扇、绳标、双刀、陌刀、横刀、拳甲）
      else if (/[剑枪伞扇绳|双|陌|横|拳][武学标刀甲]/.test(name) && (name.includes('武学增伤') || name.includes('武学增效'))) {
        // 提取武器类型关键词
        let weaponType = '';
        if (name.includes('剑')) weaponType = '剑';
        else if (name.includes('枪')) weaponType = '枪';
        else if (name.includes('伞')) weaponType = '伞';
        else if (name.includes('扇')) weaponType = '扇';
        else if (name.includes('绳标')) weaponType = '绳标';
        else if (name.includes('双刀')) weaponType = '双刀';
        else if (name.includes('陌刀')) weaponType = '陌刀';
        else if (name.includes('横刀')) weaponType = '横刀';
        else if (name.includes('拳甲')) weaponType = '拳甲';

        if (weaponType) {
          schoolBonuses[weaponType] = (schoolBonuses[weaponType] || 0) + value;
        }
      }
      // 单体类奇术增伤 等奇术词条
      else if (name.includes('奇术增伤')) {
        specialDmgBonus += value;
      }
    }
  }

  return { bossDmgBonus, allArtsBonus, schoolBonuses, specialDmgBonus };
}

// ============================================================
// 从装备中提取定音词条（index >= 5 的属性）
// 返回的百分比字段已经 / 100 转为小数
// ============================================================
interface DingyinExtract {
  outerPen: number;
  elemPen: number;
  bossDmgBonus: number;
  allArtsBonus: number;
  schoolBonuses: Record<string, number>;
  specialDmgBonus: number;
}

function extractDingyinFromEquipments(equipments: Equipment[]): DingyinExtract {
  let outerPen = 0;
  let elemPen = 0;
  let bossDmgBonus = 0;
  let allArtsBonus = 0;
  let specialDmgBonus = 0;
  const schoolBonuses: Record<string, number> = {};

  for (const equip of equipments) {
    if (!equip.is_wearing || !equip.attributes) continue;
    // 定音词条：index >= 5 的属性（从 NewEquipmentModal 的分组逻辑）
    for (let i = 5; i < equip.attributes.length; i++) {
      const attr = equip.attributes[i];
      const name = attr.name || '';
      const value = attr.value || 0;
      if (!name) continue;

      // --- 穿透类：数值不除以 100 ---
      if (name.includes('外功穿透')) {
        outerPen += value;
      } else if (name.includes('属攻穿透') || name.includes('属性穿透')) {
        elemPen += value;
      }
      // --- 首领增伤：百分比（小数形式）---   
      else if (name.includes('对首领单位增伤')) {
        bossDmgBonus += value;
      }
      // --- 全武学：百分比（小数形式）---
      else if (name.includes('全武学增效') || name.includes('全武学增伤')) {
        allArtsBonus += value;
      }
      // --- 门派武学增伤/增效：百分比（小数形式），按武器类型分组 ---
      else if ((name.includes('武学增伤') || name.includes('武学增效')) &&
        /[剑枪伞扇绳双陌横拳]/.test(name)) {
        let weaponType = '';
        if (name.includes('剑')) weaponType = '剑';
        else if (name.includes('枪')) weaponType = '枪';
        else if (name.includes('伞')) weaponType = '伞';
        else if (name.includes('扇')) weaponType = '扇';
        else if (name.includes('绳标')) weaponType = '绳标';
        else if (name.includes('双刀')) weaponType = '双刀';
        else if (name.includes('陌刀')) weaponType = '陌刀';
        else if (name.includes('横刀')) weaponType = '横刀';
        else if (name.includes('拳甲')) weaponType = '拳甲';

        if (weaponType) {
          schoolBonuses[weaponType] = (schoolBonuses[weaponType] || 0) + value;
        }
      }
      // --- 特殊技/奇术增伤：百分比（小数形式）---
      else if (name.includes('奇术增伤') || name.includes('特殊技增伤') || name.includes('蓄力技增伤') || name.includes('武学技增伤')) {
        specialDmgBonus += value;
      }
    }
  }

  return { outerPen, elemPen, bossDmgBonus, allArtsBonus, schoolBonuses, specialDmgBonus };
}

// ============================================================
// 构建玩家属性
// ============================================================

export function buildPlayerStats(
  rolePanelData: RolePanelData | Record<string, any> | null | undefined,
  equipments: Equipment[],
  seasonStats?: Record<string, number>,
  baseStats?: Record<string, number>
): PlayerStats {
  const panel = (rolePanelData || {}) as Record<string, any>;
  const ss = seasonStats || {};
  const bs = baseStats || {};

  // ---------- 赛季加成（来自 season_stats） ----------
  // 五维天赋外功 + 武学常驻属性
  const seasonOuterBonus = safeNum(ss['五维天赋外功']) + safeNum(ss['武学常驻属性']);
  // 天赋属攻加成（每个元素）
  const seasonEleMinBonus = safeNum(ss['天赋最小属攻']);
  const seasonEleMaxBonus = safeNum(ss['天赋最大属攻']);
  // 天赋属性增伤（百分比）
  const seasonEleDmgBonus = safeNum(ss['天赋属性增伤']) / 100;
  // 五维天赋会心 / 会意（百分比 → 小数）
  const seasonCritBonus = safeNum(ss['五维天赋会心']) / 100;
  const seasonIntentBonus = safeNum(ss['五维天赋会意']) / 100;
  // 基础精准率（当面板没有时的默认值）
  const basePrecise = safeNum(ss['基础精准率']) / 100;

  // ---------- 基础属性（来自 base_stats）：默认会/会意伤害加成、属攻穿透 ----------
  // 会心伤害加成：base_stats 为 50 → 0.5
  const baseCritDmgBonus = safeNum(bs['会心伤害加成'], 50) / 100;
  // 会意伤害加成：base_stats 为 35 → 0.35
  const baseIntentDmgBonus = safeNum(bs['会意伤害加成'], 35) / 100;
  // 属攻穿透：base_stats 为 27.6 → 27.6（数值，不是百分比）
  const baseElemPen = safeNum(bs['属攻穿透'], 27.6);

  // ---------- 外功：面板 + 赛季加成 ----------
  const minOuterRaw = safeNum(panel.MIN_W_ATK);
  const maxOuterRaw = safeNum(panel.MAX_W_ATK);
  const minOuter = minOuterRaw + seasonOuterBonus;
  const maxOuter = maxOuterRaw + seasonOuterBonus;

  // ---------- 元素攻击：面板 + 天赋属攻加成 ----------
  const elementAttacks: Record<string, { min: number; max: number; avg: number }> = {};
  for (const [elem, fields] of Object.entries(ELEMENT_FIELD_MAP)) {
    const panelMin = safeNum(panel[fields.min]);
    const panelMax = safeNum(panel[fields.max]);
    const min = panelMin + seasonEleMinBonus;
    const max = panelMax + seasonEleMaxBonus;
    elementAttacks[elem] = { min, max, avg: (min + max) / 2 };
  }

  // ---------- 三率：面板 + 五维天赋加成 ----------
  const preciseRate = readPct(panel, 'REAL_ACR_PROB') || basePrecise;
  const critRate = readPct(panel, 'REAL_CRI_PROB') + seasonCritBonus;
  const intentRate = readPct(panel, 'REAL_BASH_PROB') + seasonIntentBonus;
  const directCritRate = readPct(panel, 'DIRECT_CRI_PROB');
  const directIntentRate = readPct(panel, 'DIRECT_BASH_PROB');

  // ---------- 从装备神力词条 ----------
  const divine = extractDivineFromEquipments(equipments);
  // ---------- 从装备定音词条（index >= 5）----------
  const dingyin = extractDingyinFromEquipments(equipments);

  // 合并门派武学加成（schoolBonuses）
  const mergedSchoolBonuses: Record<string, number> = { ...divine.schoolBonuses };
  for (const [wt, val] of Object.entries(dingyin.schoolBonuses)) {
    mergedSchoolBonuses[wt] = (mergedSchoolBonuses[wt] || 0) + val;
  }

  const ret = {
    minOuter,
    maxOuter,
    avgOuter: (minOuter + maxOuter) / 2,
    elementAttacks,
    preciseRate,
    critRate: critRate + directCritRate,
    intentRate: intentRate + directIntentRate,
    directCritRate,
    directIntentRate,
    outerPen: dingyin.outerPen,
    elemPen: baseElemPen + dingyin.elemPen,
    outerDmgBonus: 0,
    elemDmgBonus: seasonEleDmgBonus,
    critDmgBonus: baseCritDmgBonus,
    intentDmgBonus: baseIntentDmgBonus,
    bossDmgBonus: divine.bossDmgBonus + dingyin.bossDmgBonus,
    allArtsBonus: divine.allArtsBonus + dingyin.allArtsBonus,
    schoolBonuses: mergedSchoolBonuses,
    specialDmgBonus: divine.specialDmgBonus + dingyin.specialDmgBonus,
    elementBonuses: {},
  };
  console.log('ret', JSON.stringify(ret));
  return ret;
}

// ============================================================
// 命中期望计算
// ============================================================

function calcHitExpectation(
  skill: FlowSkillData,
  player: PlayerStats,
  seasonStats: Record<string, number>
): { expectation: number; critMult: number; intentMult: number } {
  const force = skill.force || '';

  // 基础命中概率 (0-1)
  let preciseRate = Math.min(player.preciseRate, 1);
  let critRate = Math.min(player.critRate, 0.8);
  let intentRate = Math.min(player.intentRate, 0.4);

  // 伤害倍率
  const critMult = 1 + player.critDmgBonus + (skill.exCritDmg || 0);
  const intentMult = 1 + player.intentDmgBonus + (skill.exIntentDmg || 0);

  // 强制命中处理
  if (force === '精准') {
    return { expectation: 1, critMult, intentMult };
  }
  if (force === '会心') {
    return { expectation: critMult, critMult, intentMult };
  }
  if (force === '会意') {
    return { expectation: intentMult, critMult, intentMult };
  }

  // 命中优先级 精准 > 会意 > 会心 > 普通
  const pPrecise = preciseRate;
  const pIntent = intentRate * (1 - pPrecise);
  const pCrit = critRate * (1 - pPrecise - pIntent);
  const pNormal = Math.max(0, 1 - pPrecise - pIntent - pCrit);

  const expectation = pPrecise * 1 + pIntent * intentMult + pCrit * critMult + pNormal * 1;

  return { expectation, critMult, intentMult };
}

// ============================================================
// 单技能伤害计算
// ============================================================

function calcSingleSkillDamage(
  skill: FlowSkillData,
  action: FlowRotationAction,
  player: PlayerStats,
  flowElement: string,
  seasonStats: Record<string, number>
): { damage: number; breakdown: SkillDamageBreakdown } {
  // Boss防御与抗性
  const bossDef = seasonStats['BOSS防御'] || 559;
  const outerResist = (seasonStats['普通外功抗性'] || 20);
  const eleResist = (seasonStats['普通属性抗性'] || 24);
  const fixedCoeff = seasonStats['固伤加成'] || 0.225;

  // --- 通用增伤（来自rotation的generalBonus + 玩家面板）---
  const generalBonus = (action.generalBonus || 0)
    + player.allArtsBonus
    + player.bossDmgBonus;

  // --- 武器类型增伤 ---
  const weaponType = skill.weaponType || '';
  const weaponBonus = player.schoolBonuses[weaponType] || 0;

  // --- 奇术增伤：type === '奇术' 或 weaponType 包含 '奇术' ---
  const isSkill = (skill.type === '奇术') || (weaponType && weaponType.includes('奇术'));
  const skillBonus = isSkill ? (player.specialDmgBonus || 0) : 0;

  // --- 蓄力技增伤：isCharge === 1 ---
  const chargeBonus = (skill.isCharge === 1) ? (player.specialDmgBonus || 0) : 0;

  // --- 定音增伤 ---
  const dingyinBonus = action.isDingyin ? fixedCoeff : 0;

  // --- 易水歌层数增伤 ---
  const yishuiBonus = (action.yishui || 0) * 0.01;

  // --- 挑战层数减抗 ---
  const tiaozhanLevel = action.tiaozhan || 0;
  const outerResistActual = outerResist - tiaozhanLevel * 2;
  const eleResistActual = eleResist - tiaozhanLevel * 2;

  // --- 技能额外增伤 ---
  const exDmg = skill.exDmg || 0;

  // --- 外功攻击力（含技能额外加成）---
  const outerMin = Math.max(0, player.minOuter + (skill.exMinATK || 0));
  const outerMax = Math.max(0, player.maxOuter + (skill.exMaxATK || 0));
  const outerAvg = (outerMin + outerMax) / 2;

  // --- 外功穿透 ---
  const outerPen = player.outerPen + (skill.exPen || 0);
  const outerPenBonus = outerPen > outerResistActual
    ? (outerPen - outerResistActual) / 200
    : (outerPen - outerResistActual) / 100;

  // --- 外功伤害加成 ---
  const outerDmgBonus = player.outerDmgBonus;

  // --- 外功倍率（含定音加成）---
  const outerRatio = (skill.outerRatio || 0) * (1 + dingyinBonus);

  // --- 固伤（含定音加成）---
  const fixed = (skill.fixed || 0) * (1 + dingyinBonus);

  // --- 外功部分 ---
  const outerPart = Math.max(0, (outerAvg - bossDef) * outerRatio + fixed)
    * (1 + outerPenBonus)
    * (1 + outerDmgBonus);

  // --- 属性攻击力 ---
  const eleFields = ELEMENT_FIELD_MAP[flowElement] || ELEMENT_FIELD_MAP['无相'];
  const eleMin = player.elementAttacks[flowElement]?.min || 0;
  const eleMax = player.elementAttacks[flowElement]?.max || 0;
  const eleAvg = (eleMin + eleMax) / 2;

  // --- 属性穿透 ---
  const elePen = player.elemPen + (skill.exPen || 0);
  const elePenBonus = elePen > eleResistActual
    ? (elePen - eleResistActual) / 200
    : (elePen - eleResistActual) / 100;

  // --- 属性伤害加成 ---
  const elemDmgBonus = player.elemDmgBonus + (player.elementBonuses[flowElement] || 0);

  // --- 属性倍率 ---
  const eleRatio = skill.eleRatio || 0;

  // --- 属性部分（含固伤1.5倍系数）---
  const eleFixedPart = fixed * 1.5;
  const elePartTotal = (eleAvg * eleRatio + eleFixedPart)
    * (1 + elePenBonus)
    * (1 + elemDmgBonus);

  // --- 命中期望 ---
  const hitExp = calcHitExpectation(skill, player, seasonStats);

  // --- 基础伤害（命中前）---
  const baseDamage = (outerPart + elePartTotal)
    * (1 + generalBonus + exDmg + yishuiBonus + weaponBonus + skillBonus + chargeBonus);

  const singleDamage = baseDamage * hitExp.expectation;

  return {
    damage: singleDamage,
    breakdown: {
      name: action.name,
      count: action.count,
      singleDamage: Math.round(singleDamage),
      totalDamage: Math.round(singleDamage * action.count),
      weaponBonus,
      hitExpectation: hitExp.expectation,
      isDingyin: action.isDingyin,
      generalBonus,
      outerPart,
      elePart: elePartTotal,
      fixedPart: fixed,
    },
  };
}

// ============================================================
// 主计算函数
// ============================================================

export function calculateGraduationRate(
  flowType: string,
  flowConfig: FlowConfigData,
  flowSkills: Record<string, FlowSkillData>,
  flowRotation: FlowRotationAction[],
  rolePanelData: RolePanelData | Record<string, any> | null | undefined,
  equipments: Equipment[]
): GraduationCalcResult {
  const config = flowConfig.flows[flowType];
  const seasonStats = flowConfig.season_stats || {};
  const baseStats = flowConfig.base_stats || {};
  const missingData: string[] = [];

  if (!config) {
    return {
      flowType,
      element: '',
      baseline: 0,
      battleTime: 0,
      totalDamage: 0,
      graduationRate: 0,
      adps: 0,
      skillBreakdown: [],
      playerStats: buildPlayerStats(rolePanelData, equipments, seasonStats, baseStats),
      missingData: [`未知流派: ${flowType}`],
    };
  }

  const element = config.element;
  const baseline = config.baseline || 0;
  const battleTime = config.battle_time || 78;

  // 构建玩家属性（含赛季加成 + base_stats 基础属性）
  const playerStats = buildPlayerStats(rolePanelData, equipments, seasonStats, baseStats);

  // 检查是否有必要数据
  if (!rolePanelData || (!rolePanelData.MIN_W_ATK && !rolePanelData.MAX_W_ATK)) {
    missingData.push('缺少角色面板数据（外功攻击）');
  }

  // 逐技能计算总伤害
  let totalDamage = 0;
  const breakdown: SkillDamageBreakdown[] = [];
  const hasIncluded = flowRotation.some(a => a.included);

  for (const action of flowRotation) {
    // 判断是否使用该技能
    let useSkill = true;
    if (hasIncluded) {
      useSkill = !!action.included;
    }
    if (!useSkill) continue;

    const skill = flowSkills[action.name];
    if (!skill) {
      breakdown.push({
        name: action.name,
        count: action.count,
        singleDamage: 0,
        totalDamage: 0,
        weaponBonus: 0,
        hitExpectation: 0,
        isDingyin: action.isDingyin,
        generalBonus: action.generalBonus || 0,
        outerPart: 0,
        elePart: 0,
        fixedPart: 0,
      });
      missingData.push(`技能数据缺失: ${action.name}`);
      continue;
    }

    const result = calcSingleSkillDamage(skill, action, playerStats, element, seasonStats);
    totalDamage += result.damage * action.count;
    breakdown.push(result.breakdown);
  }

  // 计算毕业率
  const graduationRate = baseline > 0 ? (totalDamage / baseline) * 100 : 0;
  const adps = battleTime > 0 ? totalDamage / battleTime : 0;

  return {
    flowType,
    element,
    baseline,
    battleTime,
    totalDamage: Math.round(totalDamage),
    graduationRate: Math.round(graduationRate * 100) / 100,
    adps: Math.round(adps),
    skillBreakdown: breakdown,
    playerStats,
    missingData,
  };
}
