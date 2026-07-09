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
export type EquipmentSlot = '主武器' | '副武器' | '环' | '佩' | '冠胄' | '胸甲' | '胫甲' | '腕甲' | '射决' | '弓';

// 弓诀类型
export type BowType = '精准弓' | '会心弓' | '会意弓';

// 套装类型
export type SuitType = 
  | '玉斗' | '飞隼' | '时雨' | '断岳' | '烟柳' 
  | '浣花' | '燕归' | '连星' | '撼天' | '裁云';

// 游戏角色信息（来自网易大神）
export interface GameRole {
  uid: string;
  appKey: string;
  roleId: string;
  server: string;
  game: string;
  nick: string;
  level: string;
  icon: string;
  serverName: string;
}

// 登录凭证
export interface AuthCredentials {
  cookies: any;
  loginToken: string;
  roles: GameRole[];
  timestamp: number;
}

// 角色
export interface Character {
  id: string;
  name: string;
  icon?: string;
  level?: string;
  server_name?: string;
  role_id?: string;
  server?: string;
  uuid?: string;
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
  rawEquipmentId?: string;
  retone?: RetoneInfo;
  legacyTs?: number;
  created_at: Date;
  updated_at: Date;
}

// 装备属性
export interface EquipmentAttribute {
  name: string;
  value: number;
  is_main: boolean;
  rate?: number;
  quality?: number;
  affixId?: number;
}

// 调律记录：某次调律把某位置/序号的词条替换为新词条
export interface RetoneRecord {
  slot: number;          // 调律位置/序号
  affixIds: number[];    // 调律成的词条编号
}

// 调律回退记录：退回的词条及其数值
export interface RetoneTakebackRecord {
  affixId: number;       // 退回的词条编号
  value: number;         // 退回的数值
}

// 装备调律信息（从游戏导入的装备才携带）
export interface RetoneInfo {
  retoned: number;                       // 调律次数
  toneDeterminId?: number;               // 当前定调词条编号
  toneExp?: number;                      // 调律经验
  rawAffixId?: number;                   // 原始调律词条编号
  affixHistory?: RetoneRecord[];         // 调律历史
  takebackHistory?: RetoneTakebackRecord[]; // 调律回退历史
  nextRetoneTs?: number;                 // 下次可调律时间戳
}

// 角色属性面板数据
export interface RolePanelData {
  roleId: string;
  isBloodDifficulty: number;
  createTime: number;
  xiuweiExplore: number;
  hpMax: string;
  breakLog: Array<{ numW: number; dt: string }>;
  kungFuDayCountList: Array<{ maxScore: number; dt: string }>;
  kungFuDayCountRecent30List: Array<{ maxScore: number; dt: string }>;
  MIN_W_ATK: string;
  MAX_W_ATK: string;
  W_DEF: string;
  ACR_PROB: string;
  REAL_ACR_PROB: string;
  CRI_PROB: string;
  REAL_CRI_PROB: string;
  BASH_PROB: string;
  REAL_BASH_PROB: string;
  DIRECT_CRI_PROB: string;
  DIRECT_BASH_PROB: string;
  MIN_PRO_ATK_A: string;
  MAX_PRO_ATK_A: string;
  MIN_PRO_ATK_B: string;
  MAX_PRO_ATK_B: string;
  MIN_PRO_ATK_C: string;
  MAX_PRO_ATK_C: string;
  MIN_PRO_ATK_E: string;
  MAX_PRO_ATK_E: string;
  MIN_ACTIVE_PRO_ATK: string;
  MAX_ACTIVE_PRO_ATK: string;
  [key: string]: any;
}

export interface RoleInfo {
  xinfa_info: any[];
}

// 心法数据
export interface XinfaData {
  id: number;
  name: string;
  image1: string;
  image2: string;
  image3: string;
  bg: string;
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

// 分享的角色快照数据
export interface SharedCharacterData {
  character: {
    name: string;
    icon?: string;
    level?: string;
    server_name?: string;
  };
  equipments: Equipment[];
  rolePanelData?: Record<string, any> | null;
  createdAt: string;
}

// 常量定义
export const FLOW_TYPES: FlowType[] = [
  '鸣金虹', '鸣金影', '破竹尘', '破竹风', '破竹鸢',
  '裂石威', '裂石钧', '牵丝玉', '牵丝翊', '牵丝霖'
];

export const VERSIONS: VersionType[] = ['5.2（易水）', '5.3（凝神）'];

export const FLOW_CATEGORIES: FlowCategory[] = ['通用', '鸣金', '裂石', '牵丝', '破竹'];

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['主武器', '副武器', '环', '佩', '冠胄', '胸甲', '胫甲', '腕甲', '射决', '弓'];

export const BOW_TYPES: BowType[] = ['精准弓', '会心弓', '会意弓'];

export const SUIT_TYPES: SuitType[] = [
  '玉斗', '飞隼', '时雨', '断岳', '烟柳',
  '浣花', '燕归', '连星', '撼天', '裁云'
];
