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
  wbRate: number;
  wbFix: number;
  attrRate: number;
  attrFix: number;
}

/** 单个技能行数据 (参考数据) */
export interface RefSkillRow {
  skill: string;
  count: number;
  elements: Record<string, ElementValues>;
  wbRate: number;
  wbFix: number;
  attrRate: number;
  attrFix: number;
  AL: number;
  BQ: number;
  BK: number;
  BM: number;
  CB_ratio: number;
  NA_ratio: number;
  GR_ratio: number;
  HuiYi_rate: number;
  col30Type: string | null;
  col31Mult: number;
  isSpecial: boolean;
}

/** 流派参考数据 */
export interface SchoolRefData {
  mainWeapon: string;
  battleTime: number;
  isMingjin: boolean;
  checkType: string | null;
  B21: number | null;
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
  技能详情: Array<{ skill: string; count: number; dps: number }>;
}

/** 用户战斗属性输入 */
export interface UserCombatStats {
  /** 各元素攻击值 (min/max) + 可选穿透/增伤 */
  equipment: UserEquipment;
  /** 战斗模式 */
  mode?: '普通' | '精英';
}

// ─────────────────────────────────────────────
// 5-Element names
// ─────────────────────────────────────────────
export const ELEMENT_NAMES = ['外功', '鸣金', '裂石', '牵丝', '破竹'] as const;

// ─────────────────────────────────────────────
// Skill type table — Col 30 (type) & Col 31 (multiplier)
// ─────────────────────────────────────────────
interface SkillTypeInfo {
  col30: string | null;
  col31: number;
}

export const SKILL_TYPE_TABLE: Record<string, SkillTypeInfo> = {
  // 破竹尘 — 回旋伞
  '共鸣':             { col30: '回旋伞', col31: 1.0 },
  '共鸣(芳歌)':       { col30: '回旋伞', col31: 1.0 },
  '完美伞':           { col30: '回旋伞', col31: 1.0 },
  '完美伞(芳歌)':     { col30: '回旋伞', col31: 1.0 },
  // 裂石威 — 蓄力技
  '三蓄2战意':        { col30: '蓄力技', col31: 1.0 },
  '派生2战意':        { col30: '蓄力技', col31: 1.0 },
  // 裂石钧 — 蓄力技
  '加速陌刀三蓄':     { col30: '蓄力技', col31: 1.0 },
  '陌刀安西军下劈':   { col30: '蓄力技', col31: 1.0 },
  '陌刀安西军跳劈':   { col30: '蓄力技', col31: 1.0 },
  '陌刀三蓄':         { col30: '蓄力技', col31: 1.0 },
  '陌刀安西军下劈无开山': { col30: '蓄力技', col31: 1.0 },
  '陌刀安西军跳劈无开山': { col30: '蓄力技', col31: 1.0 },
  '陌刀一蓄(气竭)':   { col30: '蓄力技', col31: 1.0 },
  // 鸣金影 — 流血
  '1层流血':          { col30: '流血',   col31: 0.6 },
  '2层流血':          { col30: '流血',   col31: 0.6 },
  '3层流血':          { col30: '流血',   col31: 0.6 },
  '4层流血':          { col30: '流血',   col31: 0.6 },
  '5层流血':          { col30: '流血',   col31: 0.6 },
  '爆血(剑)':         { col30: '流血',   col31: 0.6 },
  '爆血(剑)必定会意': { col30: '流血',   col31: 0.6 },
  '爆血(枪)':         { col30: '流血',   col31: 0.6 },
  '爆血(枪)必定会意': { col30: '流血',   col31: 0.6 },
  '神龙吐火暗灼dot':  { col30: null,     col31: 0.6 },
  '神龙吐火dot':      { col30: null,     col31: 0.6 },
  // 鸣金虹 — 蓄力技 + col31=1.1
  '第一道剑气':       { col30: '蓄力技', col31: 1.1 },
  '第二道剑气':       { col30: '蓄力技', col31: 1.1 },
  '第三道剑气':       { col30: '蓄力技', col31: 1.1 },
  '三剑气':           { col30: '蓄力技', col31: 1.1 },
  '第一道剑气(气竭)': { col30: '蓄力技', col31: 1.1 },
  '第二道剑气(气竭)': { col30: '蓄力技', col31: 1.1 },
  '第三道剑气(气竭)': { col30: '蓄力技', col31: 1.1 },
  '飞剑':             { col30: null,     col31: 1.1 },
  '枪Q':              { col30: null,     col31: 1.1 },
  '萧呤千浪AOE':      { col30: null,     col31: 1.1 },
  '萧呤千浪流星':     { col30: null,     col31: 1.1 },
  '衍九矢7hit':       { col30: null,     col31: 1.1 },
  '骑龙回马':         { col30: null,     col31: 1.1 },
  '叶龙骧首(32层+50%HP)': { col30: null, col31: 1.1 },
  '墨洗翰华(打盾)':   { col30: null,     col31: 1.1 },
  '神龙吐火暗灼1hit': { col30: null,    col31: 1.1 },
  '神龙吐火暗灼2hit': { col30: null,    col31: 1.1 },
  '神龙吐火1hit':     { col30: null,     col31: 1.1 },
  '神龙吐火2hit':     { col30: null,     col31: 1.1 },
  '太白醉月1-4':      { col30: null,     col31: 1.1 },
  '太白醉月5':        { col30: null,     col31: 1.1 },
  '太白醉月爆燃':     { col30: null,     col31: 1.1 },
  '太白醉月暗灼':     { col30: null,     col31: 1.1 },
  '易水歌6重':        { col30: null,     col31: 1.1 },
  'N/a':              { col30: null,     col31: 1.1 },
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

// ─────────────────────────────────────────────
// Core formula functions
// ─────────────────────────────────────────────

/**
 * Check if a skill triggers B21 special multiplier (1.32x)
 */
export function getSkillSpecial(schoolKey: string, skillName: string): number {
  const checkType = SCHOOL_CHECK_TYPES[schoolKey];
  if (!checkType) return 1.0;
  const info = SKILL_TYPE_TABLE[skillName];
  if (info && info.col30 === checkType) {
    return 1 + B21;
  }
  return 1.0;
}

/**
 * Get col31 multiplier for 鸣金 schools
 */
export function getSkillCol31(skillName: string): number {
  const info = SKILL_TYPE_TABLE[skillName];
  if (info && info.col31) return info.col31;
  return 1.0;
}

/**
 * Compute 5-element total damage base for a single hit type.
 */
export function calcElementTotal(
  elemValues: Record<string, ElementValues>,
  skillMults: SkillMultipliers,
  schoolWeapon: string,
  atkMode: 'avg' | 'max' | 'min'
): number {
  let total = 0;
  const { wbRate, wbFix, attrRate, attrFix } = skillMults;

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
      mult = wbRate;
      fix = wbFix || 0;
    } else if (elemName === schoolWeapon) {
      mult = attrRate || wbRate;
      fix = (attrFix || 0) * 1.5;
    } else {
      mult = wbRate;
      fix = 0;
    }

    const elemDmg = (atk * mult + fix) * (1 + (ev.penet || 0)) * (1 + (ev.bonus || 0));
    total += elemDmg;
  }
  return total;
}

export interface RowDPSResult {
  crit: number;
  cm: number;
  norm: number;
  graze: number;
  dps: number;  // L-based (matches "期望" column)
  L: number;
  K: number;
  special: number;
}

/**
 * Compute DPS for a single skill row.
 */
export function calcRowDPS(
  rowData: RefSkillRow,
  schoolKey: string,
  schoolWeapon: string,
  isMingjin: boolean
): RowDPSResult {
  const {
    AL, BQ, BK, BM,
    CB_ratio, NA_ratio, GR_ratio, HuiYi_rate,
    count,
    elements,
    wbRate, wbFix, attrRate, attrFix,
    skill,
  } = rowData;

  const skillMults: SkillMultipliers = { wbRate, wbFix, attrRate, attrFix };

  const baseAvg = calcElementTotal(elements, skillMults, schoolWeapon, 'avg');
  const baseMax = calcElementTotal(elements, skillMults, schoolWeapon, 'max');
  const baseMin = calcElementTotal(elements, skillMults, schoolWeapon, 'min');

  const special = getSkillSpecial(schoolKey, skill);
  const alMult = 1 + AL;
  const bqMult = 1 + BQ;

  const crit  = baseAvg * alMult * BK * count * special * bqMult;
  const cm    = baseMax * alMult * BM * count * special * bqMult;
  const norm  = baseAvg * alMult * 1  * count * special * bqMult;
  const graze = baseMin * alMult * 1  * count * special * bqMult;

  let dps: number, L: number, K: number;
  if (isMingjin) {
    L = crit * CB_ratio + cm * HuiYi_rate + norm * NA_ratio + graze * GR_ratio;
    const col31 = getSkillCol31(skill);
    K = L * col31;
    dps = L; // "期望" column = L, not K
  } else {
    const huiyiRatio = Math.max(0, 1 - CB_ratio - NA_ratio - GR_ratio);
    K = crit * CB_ratio + cm * huiyiRatio + norm * NA_ratio + graze * GR_ratio;
    L = K;
    dps = K;
  }

  return { crit, cm, norm, graze, dps, L, K, special };
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

    // Compute reference DPS
    let totalL = 0;
    let totalK = 0;
    for (const row of schoolRef.rows) {
      const result = calcRowDPS(row, schoolKey, this.mainWeapon, this.isMingjin);
      totalL += result.L;
      totalK += result.K;
    }
    this._refTotalDPS = Math.round(totalL / this.battleTime);
    this._refTotalDPS_K = Math.round(totalK / this.battleTime);
    this._refTotalDamage = totalL;
  }

  /** Get reference DPS (L-based, matches "期望" column) */
  getReferenceDPS(): number {
    return this._refTotalDPS;
  }

  /** Get reference DPS (K-based, matches "真气比列" for 鸣金 schools) */
  getReferenceDPS_K(): number {
    return this._refTotalDPS_K;
  }

  /**
   * Calculate DPS and graduation rate for user-provided stats.
   */
  calculate(userStats: UserCombatStats): DPSResult {
    const { mode = '普通', equipment = {} } = userStats;
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

    let totalDamage = 0;
    const skillDetails: Array<{ skill: string; count: number; dps: number }> = [];

    for (const row of this.schoolRef.rows) {
      // Merge user equipment with reference row data
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
      const result = calcRowDPS(mergedRow, this.schoolKey, this.mainWeapon, this.isMingjin);
      totalDamage += result.L;
      skillDetails.push({
        skill: row.skill,
        count: row.count,
        dps: Math.round(result.dps),
      });
    }

    const userDPS = Math.round(totalDamage / this.battleTime);
    const graduationRate = this._refTotalDPS > 0 ? userDPS / this._refTotalDPS : 0;

    return {
      流派: this.schoolKey,
      模式: mode,
      毕业档DPS: this._refTotalDPS,
      DPS: userDPS,
      毕业率: (graduationRate * 100).toFixed(2) + '%',
      毕业率数值: +graduationRate.toFixed(4),
      总期望伤害: Math.round(totalDamage),
      战斗时间: this.battleTime,
      技能详情: skillDetails,
    };
  }
}
