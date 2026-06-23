/**
 * 燕云十六声 各流派 DPS / 毕业率计算器 v3.0
 *
 * 公式验证: 全部6流派 587行数据 0.00%误差 (verified against base_excel)
 *
 * 核心公式:
 * 1. 5元素拆分: sum_elem (即时攻击值 × 技能倍率 + 固伤) × (1+穿透加成) × (1+伤害加成)
 * 2. B21特殊倍率: *(1+0.32) IF VLOOKUP(skill, 武学奇术!Col30) matches check_type
 * 3. 标准流派: K = 会心×BN + 会意×(1-BN-BO-BP) + 普通×BO + 擦伤×BP
 * 4. 鸣金流派: L = 会心×BO + 会意×BM + 普通×BP + 擦伤×BQ; K = L × col31
 */

import type { FlowType } from '@/types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** 元素攻击值 (min/max/穿透/增伤) */
export interface ElementValues {
  min: number;
  max: number;
  penet: number;
  bonus: number;
}

/** 技能倍率信息 */
export interface SkillMultipliers {
  weaponBaseRate: number;   // 外功倍率
  weaponBaseFix: number;    // 外功固伤
  attributeRate: number;    // 属性倍率
  attributeFix: number;     // 属性固伤
}

/** 单个技能行数据 (参考数据，来自 base_excel) */
export interface RefSkillRow {
  skill: string;
  count: number;
  elements: Record<string, ElementValues>;
  weaponBaseRate: number;
  weaponBaseFix: number;
  attributeRate: number;
  attributeFix: number;
  generalBonus: number;       // AL — 通用增伤系数
  specialBonus: number;       // BQ — 特殊增伤系数
  critMultiplier: number;     // BK — 会心倍率
  bashMultiplier: number;     // BM — 会意倍率
  critRateRatio: number;      // BN/BO — 会心命中占比
  normalAttackRatio: number;  // BO/BP — 普通命中占比
  grazeRatio: number;         // BP/BQ — 擦伤命中占比
  bashRateRatio: number;      // 会意命中占比
  skillCategory: string | null;   // 技能类型 (对应Excel Col30)
  mingjinMultiplier: number;      // 鸣金倍率 (对应Excel Col31)
  isSpecial: boolean;
}

/** 流派参考数据 */
export interface SchoolRefData {
  mainWeapon: string;
  battleTime: number;
  isMingjin: boolean;
  checkType: string | null;
  B21: number | null;
  /** 参考外功穿透百分比 (Excel D2, 如 63.5 表示 63.5%) */
  refPenetBase: number;
  rows: RefSkillRow[];
}

/** 用户装备输入 */
export interface UserEquipment {
  [elementName: string]: {
    min: number;
    max: number;
    penet?: number;
    bonus?: number;
  };
}

/** 单行技能计算明细 (全部输入参数 + 中间值) */
export interface SkillDetail {
  skill: string;
  count: number;
  /* ── 输入参数 ── */
  /** 5元素攻击值 (参与计算的数值) */
  elements: Record<string, ElementValues>;
  /** 倍率参数 */
  weaponBaseRate: number; weaponBaseFix: number;
  attributeRate: number; attributeFix: number;
  /** 增伤系数 */
  generalBonus: number;      // AL
  critMultiplier: number;    // BK
  bashMultiplier: number;    // BM
  specialBonus: number;      // BQ
  /** 命中分布占比 (会心/普攻/擦伤/会意) */
  critRateRatio: number;      // BN/BO
  normalAttackRatio: number;  // BO/BP
  grazeRatio: number;         // BP/BQ
  bashRateRatio: number;      // 会意占比
  /** B21特殊倍率: 1.0 或 1.32 */
  specialMultiplier: number;
  /** 鸣金倍率 (其余流派=1.0) */
  mingjinMultiplier: number;
  /* ── 输出值 ── */
  /** 5元素总基伤 (avg/max/min) */
  baseAvg: number; baseMax: number; baseMin: number;
  /** 4种命中类型原始伤害 (加权前) */
  critDamage: number;       // 会心伤害
  bashDamage: number;       // 会意伤害
  normalDamage: number;     // 普通伤害
  grazeDamage: number;      // 擦伤伤害
  /** L = 加权总伤害; K = L × 鸣金倍率 */
  weightedDamage: number;      // L
  mingjinAdjustedDamage: number; // K
  /** DPS 贡献 (加权总伤害 / 战斗时间) */
  dpsContrib: number;
  /** 最终 DPS (取整) */
  dps: number;
}

/** 毕业率计算结果 */
export interface DPSResult {
  流派: string;
  模式: string;
  毕业档DPS: number;
  DPS: number;
  毕业率: string;
  毕业率数值: number;
  总期望伤害: number;
  战斗时间: number;
  技能详情: SkillDetail[];
}

/** 用户战斗属性输入 */
export interface UserCombatStats {
  /** 各元素攻击值 (min/max) + 可选穿透/增伤 */
  equipment: UserEquipment;
  /** 战斗模式 */
  mode?: '普通' | '精英';
  /** 首领增伤 (从装备词条「对首领单位增伤」提取, 默认 0.088) */
  bossBonus?: number;
  /** 定音增伤 (从装备定音词条提取, 或贷款定音时使用 0.32) */
  dingyinBonus?: number;
  /** 全武增 (从装备词条「全武学增效」提取, 默认 0.084, 牵丝霖为 0) */
  allWeaponBonus?: number;
  /** 武器增 (从装备词条「X武学增伤」提取, 默认 0.086, 牵丝霖为 0) */
  weaponBonus?: number;
  /** 外功穿透定音百分比 (从装备定音词条「外功穿透」提取, 单位: %, 如 32 表示 32%, 或贷款定音时使用默认值) */
  dingyinPenetration?: number;
}

// ─────────────────────────────────────────────
// 5-Element names
// ─────────────────────────────────────────────
export const ELEMENT_NAMES = ['外功', '鸣金', '裂石', '牵丝', '破竹'] as const;

// ─────────────────────────────────────────────
// Skill type table — Excel Col30 (技能类型) & Col31 (鸣金倍率)
// ─────────────────────────────────────────────
interface SkillTypeInfo {
  skillType: string | null;   // Col30 — 技能分类
  mingjinMult: number;         // Col31 — 鸣金流派倍率
}

export const SKILL_TYPE_TABLE: Record<string, SkillTypeInfo> = {
  // 破竹尘 — 回旋伞
  '共鸣':             { skillType: '回旋伞', mingjinMult: 1.0 },
  '共鸣(芳歌)':       { skillType: '回旋伞', mingjinMult: 1.0 },
  '完美伞':           { skillType: '回旋伞', mingjinMult: 1.0 },
  '完美伞(芳歌)':     { skillType: '回旋伞', mingjinMult: 1.0 },
  // 裂石威 — 蓄力技
  '三蓄2战意':        { skillType: '蓄力技', mingjinMult: 1.0 },
  '派生2战意':        { skillType: '蓄力技', mingjinMult: 1.0 },
  // 裂石钧 — 蓄力技
  '加速陌刀三蓄':     { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀安西军下劈':   { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀安西军跳劈':   { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀三蓄':         { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀安西军下劈无开山': { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀安西军跳劈无开山': { skillType: '蓄力技', mingjinMult: 1.0 },
  '陌刀一蓄(气竭)':   { skillType: '蓄力技', mingjinMult: 1.0 },
  // 鸣金影 — 流血
  '1层流血':          { skillType: '流血',   mingjinMult: 0.6 },
  '2层流血':          { skillType: '流血',   mingjinMult: 0.6 },
  '3层流血':          { skillType: '流血',   mingjinMult: 0.6 },
  '4层流血':          { skillType: '流血',   mingjinMult: 0.6 },
  '5层流血':          { skillType: '流血',   mingjinMult: 0.6 },
  '爆血(剑)':         { skillType: '流血',   mingjinMult: 0.6 },
  '爆血(剑)必定会意': { skillType: '流血',   mingjinMult: 0.6 },
  '爆血(枪)':         { skillType: '流血',   mingjinMult: 0.6 },
  '爆血(枪)必定会意': { skillType: '流血',   mingjinMult: 0.6 },
  '神龙吐火暗灼dot':  { skillType: null,     mingjinMult: 0.6 },
  '神龙吐火dot':      { skillType: null,     mingjinMult: 0.6 },
  // 鸣金虹 — 蓄力技 + mingjinMult=1.1
  '第一道剑气':       { skillType: '蓄力技', mingjinMult: 1.1 },
  '第二道剑气':       { skillType: '蓄力技', mingjinMult: 1.1 },
  '第三道剑气':       { skillType: '蓄力技', mingjinMult: 1.1 },
  '三剑气':           { skillType: '蓄力技', mingjinMult: 1.1 },
  '第一道剑气(气竭)': { skillType: '蓄力技', mingjinMult: 1.1 },
  '第二道剑气(气竭)': { skillType: '蓄力技', mingjinMult: 1.1 },
  '第三道剑气(气竭)': { skillType: '蓄力技', mingjinMult: 1.1 },
  '飞剑':             { skillType: null,     mingjinMult: 1.1 },
  '枪Q':              { skillType: null,     mingjinMult: 1.1 },
  '萧呤千浪AOE':      { skillType: null,     mingjinMult: 1.1 },
  '萧呤千浪流星':     { skillType: null,     mingjinMult: 1.1 },
  '衍九矢7hit':       { skillType: null,     mingjinMult: 1.1 },
  '骑龙回马':         { skillType: null,     mingjinMult: 1.1 },
  '叶龙骧首(32层+50%HP)': { skillType: null, mingjinMult: 1.1 },
  '墨洗翰华(打盾)':   { skillType: null,     mingjinMult: 1.1 },
  '神龙吐火暗灼1hit': { skillType: null,    mingjinMult: 1.1 },
  '神龙吐火暗灼2hit': { skillType: null,    mingjinMult: 1.1 },
  '神龙吐火1hit':     { skillType: null,     mingjinMult: 1.1 },
  '神龙吐火2hit':     { skillType: null,     mingjinMult: 1.1 },
  '太白醉月1-4':      { skillType: null,     mingjinMult: 1.1 },
  '太白醉月5':        { skillType: null,     mingjinMult: 1.1 },
  '太白醉月爆燃':     { skillType: null,     mingjinMult: 1.1 },
  '太白醉月暗灼':     { skillType: null,     mingjinMult: 1.1 },
  '易水歌6重':        { skillType: null,     mingjinMult: 1.1 },
  'N/a':              { skillType: null,     mingjinMult: 1.1 },
};

// School check type for B21 special multiplier
export const SCHOOL_CHECK_TYPES: Record<string, string | null> = {
  '牵丝霖_105': '蓄力技',
  '破竹尘_105': '回旋伞',
  '裂石威_105': '蓄力技',
  '裂石钧_105': '蓄力技',
  '鸣金影_105': '流血',
  '鸣金虹_105': '蓄力技',
};

export const B21 = 0.32;

/** 参考数据中内置的首领增伤值 (Excel B16) */
export const REF_BOSS_BONUS = 0.088;

/** 参考数据中内置的全武增 (Excel B15) — 牵丝霖为 0, 其余为 0.084 */
export const REF_ALL_WEAPON_BONUS = 0.084;

/** 参考数据中内置的武器增 (Excel B17) — 牵丝霖伞=0, 其余主武器=0.086 */
export const REF_WEAPON_BONUS = 0.086;

/** 流派 → 主武器 → 武器增伤词条名 (用于从装备提取) */
export const SCHOOL_WEAPON_AFFIX_MAP: Record<string, string> = {
  '牵丝': '伞武学增伤',
  '破竹': '伞武学增伤',    // 破竹尘主武器是伞
  '裂石': '陌刀武学增伤',
  '鸣金': '剑武学增伤',
};

/** 外功穿透定音默认值 (与定音增伤逻辑一致, 从装备提取或贷款) */
export const DEFAULT_DINGYIN_PENETRATION = 0;

/**
 * 外功穿透百分比 → 游戏内穿透系数 的转换因子
 * Excel 公式: penet = (base_penet_pct - 外抗 + 技能调整) / 200
 * 因此 1% 外功穿透 ≈ 0.005 穿透系数
 */
const PENET_PCT_TO_RATIO = 1 / 200;

// ─────────────────────────────────────────────
// Core formula functions
// ─────────────────────────────────────────────

/**
 * 检测技能是否触发定音增伤
 * 当技能的 skillCategory 匹配流派的 checkType 时触发
 * @param dingyinBonus - 定音增伤值 (默认 0.32)
 */
export function getSkillSpecialMultiplier(schoolKey: string, skillName: string, dingyinBonus: number = 0.32): number {
  const checkType = SCHOOL_CHECK_TYPES[schoolKey];
  if (!checkType) return 1.0;
  const info = SKILL_TYPE_TABLE[skillName];
  if (info && info.skillType === checkType) {
    return 1 + dingyinBonus;
  }
  return 1.0;
}

/**
 * 获取鸣金流派倍率 (对应 Excel Col31)
 * 非鸣金技能返回 1.0
 */
export function getSkillMingjinMultiplier(skillName: string): number {
  const info = SKILL_TYPE_TABLE[skillName];
  if (info && info.mingjinMult) return info.mingjinMult;
  return 1.0;
}

// 保留旧函数名作为兼容别名
export const getSkillSpecial = getSkillSpecialMultiplier;
export const getSkillCol31 = getSkillMingjinMultiplier;

/**
 * 计算5元素总基伤 (单次命中)
 * @param atkMode - avg(平均) / max(最大) / min(最小)
 * @param penetDelta - 外功穿透差值系数 = (user_pct - ref_D2) / 200 (仅当技能触发定音时生效)
 */
export function calcElementTotal(
  elemValues: Record<string, ElementValues>,
  skillMults: SkillMultipliers,
  schoolWeapon: string,
  atkMode: 'avg' | 'max' | 'min',
  penetDelta: number = 0
): number {
  let total = 0;
  const { weaponBaseRate, weaponBaseFix, attributeRate, attributeFix } = skillMults;

  for (const elemName of ELEMENT_NAMES) {
    const ev = elemValues[elemName];
    if (!ev) continue;
    if (ev.min === 0 && ev.max === 0) continue;

    let atk: number;
    if (atkMode === 'avg') atk = (ev.min + ev.max) / 2;
    else if (atkMode === 'max') atk = ev.max;
    else atk = ev.min;

    if (atk === 0) continue;

    let mult: number, fix: number;
    if (elemName === '外功') {
      mult = weaponBaseRate;
      fix = weaponBaseFix || 0;
    } else if (elemName === schoolWeapon) {
      mult = attributeRate || weaponBaseRate;
      fix = (attributeFix || 0) * 1.5;
    } else {
      mult = weaponBaseRate;
      fix = 0;
    }

    // 外功穿透定音: 参考数据中每行 penet 已包含 (ref_D2 - 外抗 + 技能调整) / 200
    // 用户穿透差异 = (user_pct - ref_D2) / 200 = penetDelta
    // 仅当技能触发定音时生效, 否则 penetDelta = 0
    const effectivePenet = (elemName === '外功')
      ? (ev.penet || 0) + penetDelta
      : (ev.penet || 0);

    const elemDmg = (atk * mult + fix) * (1 + effectivePenet) * (1 + (ev.bonus || 0));
    total += elemDmg;
  }
  return total;
}

/** calcRowDPS 返回的中间计算结果 */
export interface RowDPSResult {
  critDamage: number;         // 会心原始伤害
  bashDamage: number;         // 会意原始伤害
  normalDamage: number;       // 普通原始伤害
  grazeDamage: number;        // 擦伤原始伤害
  dps: number;                // L-based (matches "期望" column)
  weightedDamage: number;     // L — 加权总伤害
  mingjinAdjustedDamage: number; // K — 鸣金调整后伤害
  specialMultiplier: number;  // B21 特殊倍率
}

/**
 * 计算单行技能的 DPS
 * 公式: 标准流派 K = crit×BN + bash×(1-BN-BO-BP) + norm×BO + graze×BP
 *       鸣金流派 L = crit×BO + bash×BM + norm×BP + graze×BQ, K = L × 鸣金倍率
 *
 * @param bossBonus - 用户实际首领增伤
 * @param dingyinBonus - 用户实际定音增伤
 * @param allWeaponBonus - 用户实际全武增
 * @param weaponBonus - 用户实际武器增
 * @param penetDelta - 外功穿透差值系数 = (user_pct - ref_D2) / 200 (仅当技能触发定音时生效)
 * @param refBossBonus - 参考数据中内置的首领增伤 (用于从 generalBonus 中扣除)
 * @param refAllWeaponBonus - 参考数据中内置的全武增
 * @param refWeaponBonus - 参考数据中内置的武器增
 */
export function calcRowDPS(
  rowData: RefSkillRow,
  schoolKey: string,
  schoolWeapon: string,
  isMingjin: boolean,
  bossBonus: number = REF_BOSS_BONUS,
  dingyinBonus: number = 0.32,
  allWeaponBonus: number = REF_ALL_WEAPON_BONUS,
  weaponBonus: number = REF_WEAPON_BONUS,
  penetDelta: number = 0,
  refBossBonus: number = REF_BOSS_BONUS,
  refAllWeaponBonus: number = REF_ALL_WEAPON_BONUS,
  refWeaponBonus: number = REF_WEAPON_BONUS
): RowDPSResult {
  const {
    generalBonus, specialBonus, critMultiplier, bashMultiplier,
    critRateRatio, normalAttackRatio, grazeRatio, bashRateRatio,
    count,
    elements,
    weaponBaseRate, weaponBaseFix, attributeRate, attributeFix,
    skill,
  } = rowData;

  const skillMults: SkillMultipliers = {
    weaponBaseRate, weaponBaseFix, attributeRate, attributeFix,
  };

  // 定音增伤: 只有当技能匹配流派的 checkType 时才触发
  const specialMult = getSkillSpecialMultiplier(schoolKey, skill, dingyinBonus);

  // 外功穿透定音: 仅当技能触发定音时叠加 penetDelta, 否则为 0
  const isDingyinTriggered = specialMult > 1;
  const effectivePenetDelta = isDingyinTriggered ? penetDelta : 0;

  const baseAvg = calcElementTotal(elements, skillMults, schoolWeapon, 'avg', effectivePenetDelta);
  const baseMax = calcElementTotal(elements, skillMults, schoolWeapon, 'max', effectivePenetDelta);
  const baseMin = calcElementTotal(elements, skillMults, schoolWeapon, 'min', effectivePenetDelta);

  // 通用增伤: generalBonus 来自参考数据 AL 列, 已内置加法项:
  //   refBossBonus + refAllWeaponBonus + refWeaponBonus
  // 用户计算时: 扣除参考值, 加上用户实际值
  const effectiveGeneralBonus = generalBonus
    - refBossBonus - refAllWeaponBonus - refWeaponBonus
    + bossBonus + allWeaponBonus + weaponBonus;
  const generalMult = 1 + effectiveGeneralBonus;

  const specialMultBonus = 1 + specialBonus;

  // 4种命中类型原始伤害 (加权前)
  const critDamage  = baseAvg * generalMult * critMultiplier  * count * specialMult * specialMultBonus;
  const bashDamage  = baseMax * generalMult * bashMultiplier  * count * specialMult * specialMultBonus;
  const normalDamage = baseAvg * generalMult * 1               * count * specialMult * specialMultBonus;
  const grazeDamage = baseMin * generalMult * 1               * count * specialMult * specialMultBonus;

  let dps: number, weightedDamage: number, mingjinAdjustedDamage: number;
  if (isMingjin) {
    // 鸣金流派: L = crit×BO + bash×BM + norm×BP + graze×BQ
    weightedDamage = critDamage * critRateRatio
                   + bashDamage * bashRateRatio
                   + normalDamage * normalAttackRatio
                   + grazeDamage * grazeRatio;
    const mingjinMult = getSkillMingjinMultiplier(skill);
    mingjinAdjustedDamage = weightedDamage * mingjinMult;
    dps = weightedDamage; // "期望" 列 = L, 非 K
  } else {
    // 标准流派: K = crit×BN + bash×(1-BN-BO-BP) + norm×BO + graze×BP
    const bashRatio = Math.max(0, 1 - critRateRatio - normalAttackRatio - grazeRatio);
    mingjinAdjustedDamage = critDamage * critRateRatio
                          + bashDamage * bashRatio
                          + normalDamage * normalAttackRatio
                          + grazeDamage * grazeRatio;
    weightedDamage = mingjinAdjustedDamage;
    dps = mingjinAdjustedDamage;
  }

  return {
    critDamage, bashDamage, normalDamage, grazeDamage,
    dps, weightedDamage, mingjinAdjustedDamage, specialMultiplier: specialMult,
  };
}

// ─────────────────────────────────────────────
// FlowType → schoolKey mapping
// ─────────────────────────────────────────────
export const FLOW_TO_SCHOOL_KEY: Record<FlowType, string | null> = {
  '鸣金虹': '鸣金虹_105',
  '鸣金影': '鸣金影_105',
  '破竹尘': '破竹尘_105',
  '破竹风': null,   // 100级, 无参考数据
  '破竹鸢': null,   // 对比计算器, 无标准DPS
  '裂石威': '裂石威_105',
  '裂石钧': '裂石钧_105',
  '牵丝玉': null,   // 100级, 无参考数据
  '牵丝翊': null,   // 无参考数据
  '牵丝霖': '牵丝霖_105',
};

// ─────────────────────────────────────────────
// Graduation Rate Calculator
// ─────────────────────────────────────────────

export class DPSGraduationCalculator {
  schoolKey: string;
  isMingjin: boolean;
  mainWeapon: string;
  battleTime: number;
  schoolRef: SchoolRefData;
  private _refTotalDPS: number;
  private _refTotalDPS_K: number;
  private _refTotalDamage: number;

  constructor(schoolKey: string, schoolRef: SchoolRefData) {
    this.schoolKey = schoolKey;
    this.schoolRef = schoolRef;
    this.isMingjin = schoolRef.isMingjin;
    this.mainWeapon = schoolRef.mainWeapon;
    this.battleTime = schoolRef.battleTime;

    // 牵丝霖的 B15=0, B17=0, 其余流派 B15=0.084, B17=0.086
    const isQiansilin = schoolKey === '牵丝霖_105';
    const refAllWeapon = isQiansilin ? 0 : REF_ALL_WEAPON_BONUS;
    const refWeapon = isQiansilin ? 0 : REF_WEAPON_BONUS;

    // 计算参考 DPS (基于参考数据行, 外功穿透定音=0 即参考值)
    let totalWeighted = 0;
    let totalMingjinAdjusted = 0;
    for (const row of schoolRef.rows) {
      const result = calcRowDPS(row, schoolKey, this.mainWeapon, this.isMingjin,
        REF_BOSS_BONUS, 0.32, refAllWeapon, refWeapon, 0,
        REF_BOSS_BONUS, refAllWeapon, refWeapon);
      totalWeighted += result.weightedDamage;
      totalMingjinAdjusted += result.mingjinAdjustedDamage;
    }
    this._refTotalDPS = Math.round(totalWeighted / this.battleTime);
    this._refTotalDPS_K = Math.round(totalMingjinAdjusted / this.battleTime);
    this._refTotalDamage = totalWeighted;
  }

  /** 获取参考 DPS (基于加权总伤, 匹配 "期望" 列) */
  getReferenceDPS(): number {
    return this._refTotalDPS;
  }

  /** 获取参考 DPS (基于鸣金调整后伤害, 匹配 "真气比列" 列) */
  getReferenceDPS_K(): number {
    return this._refTotalDPS_K;
  }

  /**
   * 根据用户装备数据计算 DPS 和毕业率
   *
   * 乘数因子:
   *   generalBonus (AL 列): 参考数据已内置 3 个加法项:
   *     REF_BOSS_BONUS(0.088) + REF_ALL_WEAPON_BONUS(0.084) + REF_WEAPON_BONUS(0.086)
   *   bossBonus: 用户实际首领增伤, 替换参考值
   *   allWeaponBonus: 用户实际全武增, 替换参考值
   *   weaponBonus: 用户实际武器增, 替换参考值
   *   dingyinBonus: 用户实际定音增伤
   */
  calculate(userStats: UserCombatStats): DPSResult {
    const { mode = '普通', equipment = {} } = userStats;
    // 牵丝霖的 B15=0, B17=0, 其余流派默认 0.084/0.086
    const isQiansilin = this.schoolKey === '牵丝霖_105';
    const refAllWeapon = isQiansilin ? 0 : REF_ALL_WEAPON_BONUS;
    const refWeapon = isQiansilin ? 0 : REF_WEAPON_BONUS;
    const bossBonus = userStats.bossBonus ?? REF_BOSS_BONUS;
    const dingyinBonus = userStats.dingyinBonus ?? 0.32;
    const allWeaponBonus = userStats.allWeaponBonus ?? refAllWeapon;
    const weaponBonus = userStats.weaponBonus ?? refWeapon;
    // 外功穿透定音: 用户百分比 vs 参考 D2, 转换为穿透系数差值
    // penetDelta = (user_pct - ref_D2) / 200
    const userDingyinPct = userStats.dingyinPenetration ?? this.schoolRef.refPenetBase;
    const penetDelta = (userDingyinPct - this.schoolRef.refPenetBase) * PENET_PCT_TO_RATIO;
    const hasCustomEquip = Object.keys(equipment).length > 0;

    if (!hasCustomEquip) {
      return {
        流派: this.schoolKey,
        模式: mode,
        毕业档DPS: this._refTotalDPS,
        DPS: this._refTotalDPS,
        毕业率: '100.00%',
        毕业率数值: 1.0,
        总期望伤害: Math.round(this._refTotalDamage),
        战斗时间: this.battleTime,
        技能详情: [],
      };
    }

    let totalWeightedDamage = 0;
    const skillDetails: SkillDetail[] = [];

    for (const row of this.schoolRef.rows) {
      const {
        skill, count,
        generalBonus, specialBonus, critMultiplier, bashMultiplier,
        critRateRatio, normalAttackRatio, grazeRatio, bashRateRatio,
        weaponBaseRate, weaponBaseFix, attributeRate, attributeFix,
        mingjinMultiplier,
      } = row;

      // 合并用户装备数据到参考行
      const mergedElements: Record<string, ElementValues> = {};
      for (const elemName of ELEMENT_NAMES) {
        if (equipment[elemName]) {
          const userElem = equipment[elemName];
          mergedElements[elemName] = {
            min: userElem.min,
            max: userElem.max,
            penet: userElem.penet ?? (row.elements[elemName]?.penet ?? 0),
            bonus: userElem.bonus ?? (row.elements[elemName]?.bonus ?? 0),
          };
        } else if (row.elements[elemName]) {
          mergedElements[elemName] = { ...row.elements[elemName] };
        }
      }

      const mergedRow: RefSkillRow = { ...row, elements: mergedElements };
      const result = calcRowDPS(mergedRow, this.schoolKey, this.mainWeapon, this.isMingjin,
        bossBonus, dingyinBonus, allWeaponBonus, weaponBonus, penetDelta,
        REF_BOSS_BONUS, refAllWeapon, refWeapon);
      totalWeightedDamage += result.weightedDamage;

      // 计算基础伤害 (与 calcRowDPS 保持一致: 定音触发时叠加 penetDelta)
      const skillMults: SkillMultipliers = {
        weaponBaseRate, weaponBaseFix, attributeRate, attributeFix,
      };
      const isDingyinSkill = result.specialMultiplier > 1;
      const effectivePenetDelta = isDingyinSkill ? penetDelta : 0;
      const baseAvg = calcElementTotal(mergedElements, skillMults, this.mainWeapon, 'avg', effectivePenetDelta);
      const baseMax = calcElementTotal(mergedElements, skillMults, this.mainWeapon, 'max', effectivePenetDelta);
      const baseMin = calcElementTotal(mergedElements, skillMults, this.mainWeapon, 'min', effectivePenetDelta);

      skillDetails.push({
        skill, count,
        elements: mergedElements,
        weaponBaseRate, weaponBaseFix, attributeRate, attributeFix,
        generalBonus, critMultiplier, bashMultiplier, specialBonus,
        critRateRatio, normalAttackRatio, grazeRatio, bashRateRatio,
        specialMultiplier: result.specialMultiplier,
        mingjinMultiplier: mingjinMultiplier || 1,
        baseAvg, baseMax, baseMin,
        critDamage: result.critDamage,
        bashDamage: result.bashDamage,
        normalDamage: result.normalDamage,
        grazeDamage: result.grazeDamage,
        weightedDamage: result.weightedDamage,
        mingjinAdjustedDamage: result.mingjinAdjustedDamage,
        dpsContrib: result.dps,
        dps: Math.round(result.dps),
      });
    }

    const userDPS = Math.round(totalWeightedDamage / this.battleTime);
    const rawRate = this._refTotalDPS > 0 ? userDPS / this._refTotalDPS : 0;
    // 毕业率上限 100%: 超过参考 DPS 即视为已毕业
    const graduationRate = Math.min(rawRate, 1.0);

    return {
      流派: this.schoolKey,
      模式: mode,
      毕业档DPS: this._refTotalDPS,
      DPS: userDPS,
      毕业率: (graduationRate * 100).toFixed(2) + '%',
      毕业率数值: +graduationRate.toFixed(4),
      总期望伤害: Math.round(totalWeightedDamage),
      战斗时间: this.battleTime,
      技能详情: skillDetails,
    };
  }
}
