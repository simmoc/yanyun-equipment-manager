// 燕云十六声装备毕业率管理系统 - 类型定义

// 流派类型
export type FlowType = 
  | '鸣金虹' | '鸣金影' | '破竹尘' | '破竹风' | '破竹鸢'
  | '裂石威' | '裂石钧' | '牵丝玉' | '牵丝翊' | '牵丝霖';

// 版本类型
export type VersionType = '5.2（易水）' | '5.3（凝神）';

// 流派分类
export type FlowCategory = '通用' | '鸣金' | '裂石' | '牵丝' | '破竹';

// 装备部位
export type EquipmentSlot = '剑' | '枪' | '环' | '佩' | '冠胄' | '胸甲' | '胫甲' | '腕甲';

// 弓诀类型
export type BowType = '精准弓' | '会心弓' | '会意弓';

// 套装类型
export type SuitType = 
  | '玉斗' | '飞隼' | '时雨' | '断岳' | '烟柳' 
  | '浣花' | '燕归' | '连星' | '撼天' | '裁云';

// 用户
export interface User {
  id: string;
  fingerprint: string;
  created_at: Date;
  last_login: Date;
}

// 角色
export interface Character {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// 方案
export interface Plan {
  id: string;
  character_id: string;
  name: string;
  flow_type: FlowType;
  version: VersionType;
  flow_category: FlowCategory;
  bow_type: BowType;
  suit_type: SuitType;
  loan_dingyin: boolean;
  created_at: Date;
  updated_at: Date;
}

// 装备
export interface Equipment {
  id: string;
  character_id: string;
  slot: EquipmentSlot;
  name: string;
  level: number;
  attributes: EquipmentAttribute[];
  is_wearing: boolean;
  suit_type?: SuitType;
  created_at: Date;
  updated_at: Date;
}

// 装备属性
export interface EquipmentAttribute {
  name: string;
  value: number;
  is_main: boolean;
}

// 毕业率计算结果
export interface GraduationResult {
  plan_id: string;
  overall_rate: number;
  slot_rates: Record<EquipmentSlot, number>;
  missing_attributes: string[];
  recommendations: string[];
}

// 数据导出格式
export interface ExportData {
  version: string;
  export_time: Date;
  characters: Character[];
  plans: Plan[];
  equipments: Equipment[];
}

// 常量定义
export const FLOW_TYPES: FlowType[] = [
  '鸣金虹', '鸣金影', '破竹尘', '破竹风', '破竹鸢',
  '裂石威', '裂石钧', '牵丝玉', '牵丝翊', '牵丝霖'
];

export const VERSIONS: VersionType[] = ['5.2（易水）', '5.3（凝神）'];

export const FLOW_CATEGORIES: FlowCategory[] = ['通用', '鸣金', '裂石', '牵丝', '破竹'];

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['剑', '枪', '环', '佩', '冠胄', '胸甲', '胫甲', '腕甲'];

export const BOW_TYPES: BowType[] = ['精准弓', '会心弓', '会意弓'];

export const SUIT_TYPES: SuitType[] = [
  '玉斗', '飞隼', '时雨', '断岳', '烟柳',
  '浣花', '燕归', '连星', '撼天', '裁云'
];