/**
 * 《燕云十六声》装备管理系统 - 游戏数据常量
 * 包含装备类型、品质、词条、流派、套装等全部游戏数据
 */

// ==================== 装备大类 ====================
const EQUIP_CATEGORIES = {
  weapon: { label: '武器', icon: '⚔️', slots: ['主武器'] },
  armor: { label: '防具', icon: '🛡️', slots: ['头盔', '上衣', '下装', '鞋子'] },
  accessory: { label: '饰品', icon: '💍', slots: ['项链', '戒指'] }
};

// 所有装备槽位（用于配装）
const ALL_SLOTS = ['主武器', '头盔', '上衣', '下装', '鞋子', '项链', '戒指'];

// ==================== 装备品质 ====================
const EQUIP_QUALITIES = {
  green:  { label: '绿色', color: '#4CAF50', glow: '0 0 8px #4CAF50' },
  blue:   { label: '蓝色', color: '#2196F3', glow: '0 0 8px #2196F3' },
  purple: { label: '紫色', color: '#9C27B0', glow: '0 0 10px #9C27B0' },
  gold:   { label: '金色', color: '#FFD700', glow: '0 0 12px #FFD700' }
};

// ==================== 装备等级 ====================
const EQUIP_LEVELS = [91, 96, 100, 105];

// ==================== 词条分类定义 ====================
const AFFIX_CATEGORIES = {
  attack: {
    label: '攻击类',
    affixes: [
      { key: 'max_atk',       name: '最大外功攻击', maxVal: 105.6, unit: '', desc: '常称"大攻"' },
      { key: 'min_atk',       name: '最小外功攻击', maxVal: 95,    unit: '', desc: '数值略低于最大外功' },
      { key: 'ele_mingjin',   name: '鸣金攻击',     maxVal: 59.8,  unit: '', desc: '鸣金流派属性攻击' },
      { key: 'ele_pozhu',     name: '破竹攻击',     maxVal: 59.8,  unit: '', desc: '破竹流派属性攻击' },
      { key: 'ele_qiansi',    name: '牵丝攻击',     maxVal: 59.8,  unit: '', desc: '牵丝流派属性攻击' },
      { key: 'ele_lieshi',    name: '裂石攻击',     maxVal: 59.8,  unit: '', desc: '裂石流派属性攻击' },
      { key: 'wuxing_pen',    name: '外功穿透',     maxVal: 14.6,  unit: '', desc: '武器/戒指多见' },
      { key: 'wuxiang_pen',   name: '无相穿透',     maxVal: 17.4,  unit: '', desc: '部分版本特有' },
      { key: 'true_dmg',      name: '武学真伤',     maxVal: 8.0,   unit: '', desc: '特定流派' }
    ]
  },
  rate: {
    label: '三率类',
    affixes: [
      { key: 'crit_rate',     name: '会心率', maxVal: 12.2, unit: '%', desc: '面板黄字上限80%' },
      { key: 'crit_dmg_rate', name: '会意率', maxVal: 6.0,  unit: '%', desc: '面板黄字上限约40%' },
      { key: 'precision',     name: '精准率', maxVal: 10.8, unit: '%', desc: '黄字上限100%' }
    ]
  },
  amplify: {
    label: '增伤类',
    affixes: [
      { key: 'boss_dmg',      name: '对首领增伤', maxVal: 4.4, unit: '%', desc: '' },
      { key: 'single_wuxue',  name: '单武学增伤', maxVal: 8.6, unit: '%', desc: '如剑武学/陌刀武学' },
      { key: 'all_wuxue',     name: '全武学增伤', maxVal: 4.1, unit: '%', desc: '' }
    ]
  },
  wuwei: {
    label: '五维属性',
    affixes: [
      { key: 'jin', name: '劲', maxVal: 7, unit: '点', desc: '1劲≈0.17小攻+1.41大攻' },
      { key: 'shi', name: '势', maxVal: 7, unit: '点', desc: '1势≈0.9大攻+3.5%会意率' },
      { key: 'min', name: '敏', maxVal: 7, unit: '点', desc: '1敏≈0.9小攻+7.5%会心率' },
      { key: 'ti',  name: '体', maxVal: 40.4, unit: '点', desc: '1体=60气血' },
      { key: 'yu',  name: '御', maxVal: 40, unit: '点', desc: '1御=0.6外防+17气血' }
    ]
  },
  defense: {
    label: '防御/生存',
    affixes: [
      { key: 'def',       name: '外功防御', maxVal: 52.8, unit: '', desc: '' },
      { key: 'max_hp',    name: '气血最大值', maxVal: 2400, unit: '', desc: '' }
    ]
  }
};

// 构建词条查找表 key -> affix对象
const AFFIX_MAP = {};
Object.values(AFFIX_CATEGORIES).forEach(cat => {
  cat.affixes.forEach(a => { AFFIX_MAP[a.key] = a; });
});

// ==================== 武器类型 ====================
const WEAPON_TYPES = ['长剑', '陌刀', '枪', '扇', '伞', '其他'];

// ==================== 套装列表 ====================
const EQUIP_SETS = [
  '断岳玄甲', '桂月', '燕归', '承音', '连星', '无套装', '其他'
];

// ==================== 流派定义 ====================
const FIGHTING_STYLES = {
  mingjin_ying: {
    label: '鸣金·影',
    desc: '爆发输出型，依赖会意率打出高额暴击伤害',
    // 词条优先级权重（越高越重要）
    affixWeights: {
      max_atk: 100, ele_mingjin: 95, crit_dmg_rate: 90, boss_dmg: 80,
      single_wuxue: 70, precision: 60, all_wuxue: 50, crit_rate: 40,
      wuxing_pen: 30, min_atk: 20, shi: 25, jin: 20
    },
    // 五维偏好
    wuweiPriority: ['劲', '势', '敏'],
    // 推荐套装
    recommendedSets: ['断岳玄甲', '承音'],
    // 推荐属性攻击
    recommendedEle: 'ele_mingjin',
    // 关键阈值提示
    tips: '精准率未满100%前优先补，满了后换增伤或外功'
  },
  mingjin_hong: {
    label: '鸣金·虹',
    desc: '持续输出型，均衡会心率与会意率',
    affixWeights: {
      max_atk: 90, ele_mingjin: 85, crit_rate: 85, crit_dmg_rate: 80,
      boss_dmg: 75, precision: 65, single_wuxue: 60, all_wuxue: 50,
      min_atk: 25, wuxing_pen: 25, shi: 20, jin: 20, min: 15
    },
    wuweiPriority: ['劲', '敏', '势'],
    recommendedSets: ['断岳玄甲', '承音'],
    recommendedEle: 'ele_mingjin',
    tips: '会心率与会意率均衡发展，兼顾持续输出与爆发'
  },
  lieshi_wei: {
    label: '裂石·威',
    desc: '坦克/副C型，偏气血与外防',
    affixWeights: {
      max_hp: 100, def: 95, ti: 90, yu: 85, ele_lieshi: 80,
      max_atk: 50, boss_dmg: 45, crit_rate: 30, precision: 30,
      min_atk: 20, jin: 20, crit_dmg_rate: 15
    },
    wuweiPriority: ['体', '御', '劲'],
    recommendedSets: ['桂月', '燕归'],
    recommendedEle: 'ele_lieshi',
    tips: '裂石偏气血/外防，适合副本前排'
  },
  qiansi_lin: {
    label: '牵丝·霖',
    desc: '高频会心型，堆叠会心率触发高频暴击',
    affixWeights: {
      crit_rate: 100, max_atk: 85, ele_qiansi: 80, precision: 75,
      boss_dmg: 70, single_wuxue: 65, all_wuxue: 55, min_atk: 30,
      min: 25, wuxing_pen: 25, crit_dmg_rate: 20
    },
    wuweiPriority: ['敏', '劲', '势'],
    recommendedSets: ['燕归', '承音'],
    recommendedEle: 'ele_qiansi',
    tips: '牵丝堆会心率，追求高频暴击输出'
  },
  qiansi_yu: {
    label: '牵丝·玉',
    desc: '辅助/控制型，兼顾生存与功能性',
    affixWeights: {
      max_hp: 80, crit_rate: 75, ele_qiansi: 70, max_atk: 65,
      precision: 60, def: 55, boss_dmg: 50, ti: 50, yu: 45,
      single_wuxue: 40, all_wuxue: 35, min: 20
    },
    wuweiPriority: ['体', '敏', '御'],
    recommendedSets: ['燕归', '桂月'],
    recommendedEle: 'ele_qiansi',
    tips: '兼顾生存与控制，适合辅助定位'
  },
  pozhu_feng: {
    label: '破竹·风',
    desc: '技能爆发型，依赖高倍率技能输出',
    affixWeights: {
      max_atk: 100, ele_pozhu: 90, crit_dmg_rate: 85, boss_dmg: 80,
      single_wuxue: 75, precision: 65, all_wuxue: 55, crit_rate: 45,
      shi: 30, jin: 25, min_atk: 20, wuxing_pen: 20
    },
    wuweiPriority: ['劲', '势', '敏'],
    recommendedSets: ['断岳玄甲', '承音'],
    recommendedEle: 'ele_pozhu',
    tips: '破竹风流派依赖高倍率技能，堆劲和势提升爆发'
  }
};

// ==================== 武学类型（用于单武学增伤） ====================
const WUXUE_TYPES = [
  '剑武学', '陌刀武学', '枪武学', '扇武学', '伞武学', '通用'
];

// ==================== 导出 ====================
// 这些常量在浏览器全局可用，无需module系统
