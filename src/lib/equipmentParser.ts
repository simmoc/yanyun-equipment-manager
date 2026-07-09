import type { Equipment, EquipmentSlot, SuitType, EquipmentAttribute, RetoneInfo, RetoneRecord, RetoneTakebackRecord } from '@/types';
import { EQUIPMENT_SLOTS } from '@/types';

export const slotMap: Record<string, EquipmentSlot> = {
  '1': '主武器', '2': '副武器', '3': '冠胄', '4': '胸甲',
  '5': '胫甲', '8': '腕甲', '9': '射决', '10': '环', '11': '佩', '21': '弓'
};

export const attrNameMap: Record<string, string> = {
  'MIN_W_ATK': '最小外功攻击',
  'MAX_W_ATK': '最大外功攻击',
  'MIN_M_ATK': '最小内功攻击',
  'MAX_M_ATK': '最大内功攻击',
  'DEF': '防御',
  'W_DEF': '外功防御',
  'HP': '气血',
  'HP_MAX': '气血上限',
  'ARCHER_DAMAGE': '穿透伤害',
  'ARCHER_WEAKPOINT_DAMAGE': '穿透弱点伤害',
  'PVP_DEF': 'PVP防御',
  'PVE_DEF': 'PVE防御',
  'CRI_PROB': '会心率',
  'ACR_PROB': '精准率',
  'BASH_PROB': '会意率',
  'PVP_CRI_PROB': 'PVP会心率',
  'PVP_ACR_PROB': 'PVP精准率',
  'PVP_BASH_PROB': 'PVP会意率',
  'STR': '力道',
  'BAS': '气韵',
  'CON': '根骨',
  'CRI': '身法'
};

// 解析游戏数据中 {"__": [...]} 形式的包装结构
function unwrapUnderscore(obj: any): any[] {
  if (obj && typeof obj === 'object' && '__' in obj) {
    return obj['__'];
  }
  return [];
}

// 从装备 ex 字段中提取调律(retone)信息
function extractRetoneInfo(ex: any): RetoneInfo | undefined {
  const retoned: number = ex.retoned ?? 0;
  const hasRetoneData =
    retoned > 0 ||
    ex.tone_determin ||
    ex.retone_raw_affix_no ||
    ex.retone_affix_history ||
    ex.retone_takeback_history;

  if (!hasRetoneData) return undefined;

  const affixHistory: RetoneRecord[] = unwrapUnderscore(ex.retone_affix_history)
    .filter((entry: any) => Array.isArray(entry) && entry.length >= 2)
    .map((entry: any) => ({
      slot: entry[0] as number,
      affixIds: Array.isArray(entry[1]) ? entry[1] as number[] : [entry[1] as number]
    }));

  const takebackHistory: RetoneTakebackRecord[] = unwrapUnderscore(ex.retone_takeback_history)
    .filter((entry: any) => Array.isArray(entry) && entry.length >= 2)
    .map((entry: any) => ({
      affixId: entry[0] as number,
      value: entry[1] as number
    }));

  return {
    retoned,
    toneDeterminId: ex.tone_determin,
    toneExp: ex.tone_exp,
    rawAffixId: ex.retone_raw_affix_no,
    affixHistory: affixHistory.length > 0 ? affixHistory : undefined,
    takebackHistory: takebackHistory.length > 0 ? takebackHistory : undefined,
    nextRetoneTs: ex.next_retone_ts
  };
}

export function parseRawEquipments(roleInfo: any, configData?: any): any[] {
  const rawWearEquips = roleInfo['combat_plan.wear_equips'];
  let wearEquips: Record<string, any> = {};

  if (rawWearEquips && typeof rawWearEquips === 'object') {
    wearEquips = rawWearEquips;
  } else if (roleInfo.combat_plan?.wear_equips) {
    wearEquips = roleInfo.combat_plan.wear_equips;
  }

  const equipments: any[] = [];

  for (const [slot, equipData] of Object.entries(wearEquips)) {
    const equip = equipData as any;
    const ex = equip.ex || {};
    const suffixId = ex.suffix || 0;
    const baseAffixes = ex.base_affixes || [];

    if (!equip.No || equip.No === 0 || equip.No === 2402000) {
      continue;
    }

    if (baseAffixes.length === 0 && Object.keys(ex.base_attrs || {}).length === 0) {
      continue;
    }

    let equipName = `装备${equip.No || ''}`;
    let suffixName = `套装${suffixId}`;
    let equipLevel = 0;

    if (configData?.equip_data) {
      const equipInfo = configData.equip_data[String(equip.No)];
      if (equipInfo) {
        equipName = equipInfo.name;
        equipLevel = equipInfo.level || 0;
      }
    }

    if (configData?.suffix_data) {
      const suffixInfo = configData.suffix_data[String(suffixId)];
      if (suffixInfo) {
        suffixName = suffixInfo.name;
      }
    }

    const equipmentInfo: any = {
      slot,
      no: equip.No || 0,
      name: equipName,
      level: equipLevel,
      suffix: suffixId,
      suffix_name: suffixName,
      base_attrs: ex.base_attrs || {},
      base_affixes: [],
      retone: extractRetoneInfo(ex),
      legacyTs: ex.legacy_ts as number | undefined
    };

    for (const affix of baseAffixes) {
      if (Array.isArray(affix) && affix.length >= 4) {
        let affixName = `词条${affix[0]}`;

        if (configData?.affix_data) {
          const affixInfo = configData.affix_data[String(affix[0])];
          if (affixInfo) {
            affixName = affixInfo.name;
          }
        }

        equipmentInfo.base_affixes.push({
          id: affix[0],
          name: affixName,
          value: affix[1],
          rate: Math.round(affix[2] * 100 * 100) / 100,
          quality: affix[3],
          is_max: affix.length > 4 ? affix[4] : false
        });
      }
    }

    equipments.push(equipmentInfo);
  }

  return equipments;
}

export function convertToEquipmentList(rawEquips: any[]): Equipment[] {
  const now = new Date().toISOString();

  return rawEquips.map((equip, index) => {
    const mappedSlot = slotMap[equip.slot] || EQUIPMENT_SLOTS[0];
    const attributes: EquipmentAttribute[] = [];

    // if (equip.base_attrs) {
    //   for (const [key, value] of Object.entries(equip.base_attrs)) {
    //     const name = attrNameMap[key] || key;
    //     attributes.push({ name, value: value as number, is_main: false });
    //   }
    // }

    for (const affix of equip.base_affixes || []) {
      attributes.push({
        name: affix.name || (affix.id ? `词条${affix.id}` : '未知词条'),
        value: affix.value as number,
        is_main: affix.is_max as boolean,
        rate: affix.rate as number,
        quality: affix.quality as number,
        affixId: affix.id as number | undefined
      });
    }

    const suitType = equip.suffix_name && equip.suffix_name !== '无套装' && equip.suffix_name !== '套装0'
      ? equip.suffix_name as SuitType
      : undefined;

    return {
      id: `auth_equip_${equip.slot}_${index}`,
      character_id: '',
      slot: mappedSlot,
      name: equip.name || (equip.no ? `装备${equip.no}` : '未知装备'),
      level: equip.level || 0,
      attributes,
      is_wearing: true,
      suit_type: suitType,
      retone: equip.retone as RetoneInfo | undefined,
      legacyTs: equip.legacyTs as number | undefined,
      created_at: new Date(now),
      updated_at: new Date(now)
    } as Equipment;
  });
}

export function getEquipmentsFromAuthCache(roleId: string, characterId?: string): Equipment[] | null {
  if (typeof window === 'undefined') return null;
  try {
    let authDataStr = localStorage.getItem(`auth_${roleId}`);
    if (!authDataStr && characterId) {
      authDataStr = localStorage.getItem(`auth_${characterId}`);
      if (authDataStr && roleId) {
        localStorage.setItem(`auth_${roleId}`, authDataStr);
        localStorage.removeItem(`auth_${characterId}`);
      }
    }
    if (!authDataStr) return null;
    const authData = JSON.parse(authDataStr);
    if (authData.equipments && Array.isArray(authData.equipments)) {
      return authData.equipments.map((e: any) => ({
        ...e,
        created_at: new Date(e.created_at),
        updated_at: new Date(e.updated_at)
      })) as Equipment[];
    }
    return null;
  } catch {
    return null;
  }
}
