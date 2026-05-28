#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整的角色数据解析和验证脚本 - 修复版本
直接处理原始点号分隔的数据结构
输出包含：
1. 角色基础信息
2. 角色面板属性
3. 角色装备列表（包含每件装备的属性）
"""
import json
import os
from datetime import datetime

# 配置数据
SUFFIX_DATA = {
    "1": {"name": "玉斗", "short": "斗"},
    "2": {"name": "易相", "short": "易"},
    "3": {"name": "飞隼", "short": "飞"},
    "4": {"name": "鹰扬", "short": "鹰"},
    "7": {"name": "时雨", "short": "雨"},
    "8": {"name": "桂月", "short": "月"},
    "9": {"name": "急风骤", "short": "风"},
    "10": {"name": "凌波步", "short": "步"},
    "11": {"name": "岳山倾", "short": "山"},
    "12": {"name": "御无缺", "short": "御"},
    "23": {"name": "燕归", "short": "归"},
    "24": {"name": "江凝", "short": "江"},
    "25": {"name": "烟柳重重", "short": "烟"},
    "26": {"name": "不知寒", "short": "寒"},
    "29": {"name": "浣花", "short": "花"},
    "30": {"name": "梨雪", "short": "雪"},
    "34": {"name": "连星", "short": "星"},
    "35": {"name": "抱玉", "short": "玉"},
    "44": {"name": "饮羽", "short": "羽"},
    "45": {"name": "惊弦", "short": "弦"},
    "46": {"name": "追影", "short": "影"},
    "50": {"name": "断岳", "short": "断"},
    "51": {"name": "玄甲", "short": "玄"},
    "56": {"name": "撼天", "short": "撼"},
    "57": {"name": "尚义", "short": "义"},
    "71": {"name": "裁云", "short": "云"},
    "72": {"name": "鸣珂", "short": "珂"}
}

SCHOOL_DATA = {
    "1": {"name": "天泉"},
    "2": {"name": "梨园"},
    "3": {"name": "狂澜"},
    "4": {"name": "青溪"},
    "5": {"name": "孤云"},
    "6": {"name": "三更天"},
    "7": {"name": "轻眉山庄"},
    "8": {"name": "文津馆"},
    "9": {"name": "红尘间"},
    "10": {"name": "无心谷"},
    "11": {"name": "九流门"},
    "12": {"name": "醉花阴"},
    "13": {"name": "墨山道"},
    "100": {"name": "无门无派"},
    "1007": {"name": "无门无派"}
}

ATTR_NAMES = {
    "CON": "体质",
    "STR": "劲力",
    "CRI": "机敏",
    "BAS": "气势",
    "AGI": "御劲",
    "HP_MAX": "气血上限",
    "MIN_W_ATK": "最小外功攻击",
    "MAX_W_ATK": "最大外功攻击",
    "W_ATK": "外功攻击",
    "W_DEF": "外功防御",
    "W_ATK_CRI_UP": "会心伤害加成",
    "HEAL_CRI_UP": "会心治疗加成",
    "W_ATK_CRI_UP_RDC": "会心伤害减免",
    "BASH_UP": "会意伤害加成",
    "BASH_UP_RDC": "会意伤害减免",
    "W_ATK_SCALE": "外功伤害加成",
    "W_DEF_SCALE": "外功伤害减免",
    "W_HEAL_SCALE": "外功治疗加成",
    "XIUWEI_KUNGFU": "武林造诣",
    "XIUWEI_TRADE": "营生造诣",
    "XIUWEI_EXPLORE": "探索造诣",
    "W_ATK_PEN": "外功穿透",
    "W_ATK_PEN_RDC": "外功抗性",
    "DAMAGE_REDUCE": "伤害减免",
    "CRI_PROB": "会心率",
    "BASH_PROB": "会意率",
    "ACR_PROB": "精准率",
    "ARCHER_DAMAGE": "弓箭基础伤害",
    "ARCHER_WEAKPOINT_DAMAGE": "弓箭弱点命中伤害"
}

QUALITY_COLORS = {
    1: "绿色",
    2: "蓝色",
    3: "紫色",
    4: "橙色",
    5: "粉色"
}

EQUIP_NAMES = {
    (1101800, 1101899): "武器",
    (1101700, 1101799): "护腕",
    (1101600, 1101699): "护肩",
    (1101500, 1101599): "腰带",
    (1101400, 1101499): "护腿",
    (1101300, 1101399): "护胸",
    (1101200, 1101299): "头盔",
    (1101100, 1101199): "项链",
    (1101000, 1101099): "戒指1",
    (1100900, 1100999): "戒指2",
    (1100800, 1100899): "披风",
    (1100700, 1100799): "护心",
    (1101900, 1101999): "副手",
    (1101730, 1101739): "护腕(特殊)"
}

AFFIX_ID_NAMES = {
    10613002: "外功攻击",
    10693002: "内功攻击",
    10693021: "会心伤害",
    10693012: "会心几率",
    10693007: "外功攻击",
    10693013: "会心几率",
    10693020: "会心几率",
    10693102: "内功攻击",
    10693108: "内功攻击",
    10693115: "内功攻击",
    10693118: "会心几率",
    10693119: "生命值",
    10693104: "内功攻击",
    10693107: "内功攻击",
    10693105: "内功攻击",
    10693124: "会心伤害",
    10693117: "内功攻击",
    10643004: "防御",
    10642003: "防御",
    10652007: "弓箭伤害",
    10653007: "弓箭伤害",
    10672001: "弓箭增伤",
    10172001: "弓箭伤害",
    300701: "主属性",
    300305: "主属性"
}

# 加载词缀配置
affix_data = {}
affix_config_path = os.path.join('config_data', 'affix_data.json')
if os.path.exists(affix_config_path):
    try:
        with open(affix_config_path, 'r', encoding='utf-8') as f:
            affix_data = json.load(f)
        print(f"✓ 加载词缀配置: {len(affix_data)} 个词缀")
    except Exception as e:
        print(f"✗ 加载词缀配置失败: {e}")

def get_affix_name(affix_id):
    """获取词缀名称"""
    affix_info = affix_data.get(str(affix_id))
    if affix_info and isinstance(affix_info, dict):
        name = affix_info.get('name')
        if name:
            return name
    return AFFIX_ID_NAMES.get(affix_id, f"词缀{affix_id}")

def get_attr_name(attr_key):
    """获取属性名称"""
    return ATTR_NAMES.get(attr_key, attr_key)

def get_suffix_name(suffix_id):
    """获取套装名称"""
    if not suffix_id:
        return "无套装"
    suffix_info = SUFFIX_DATA.get(str(suffix_id))
    if suffix_info:
        return suffix_info.get('name', f'套装{suffix_id}')
    return f'套装{suffix_id}'

def get_school_name(school_id):
    """获取门派名称"""
    if not school_id:
        return "无门派"
    school_info = SCHOOL_DATA.get(str(school_id))
    if school_info:
        return school_info.get('name', f'门派{school_id}')
    return f'门派{school_id}'

def get_equip_name(equip_no):
    """获取装备名称"""
    for (start, end), name in EQUIP_NAMES.items():
        if start <= equip_no <= end:
            return name
    return f"装备{equip_no}"

def format_timestamp(ts):
    """格式化时间戳"""
    if ts <= 0:
        return "未知"
    dt = datetime.fromtimestamp(ts)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def format_duration(seconds):
    """格式化时长"""
    if seconds <= 0:
        return "0秒"
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours}小时{minutes}分钟{secs}秒"
    elif minutes > 0:
        return f"{minutes}分钟{secs}秒"
    return f"{secs}秒"

def parse_character_data(raw_file_path):
    """解析角色数据 - 直接处理原始点号分隔格式"""
    print("=" * 80)
    print("开始解析角色数据...")
    print("=" * 80)
    
    # 读取原始数据
    with open(raw_file_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    
    # 获取data字段
    data = raw_data.get('data', {})
    if not data:
        print("✗ data 字段为空")
        return None
    
    # 输出3部分信息
    print("\n" + "=" * 80)
    print("【1】角色基础信息")
    print("=" * 80)
    
    nickname = data.get('base.nickname', '')
    school_id = data.get('base.school', 0)
    level = data.get('base.level', 0)
    max_xiuwei = data.get('base.max_xiuwei_kungfu', 0)
    account = data.get('_account_', '')
    number_id = data.get('base.number_id', '')
    create_time = data.get('base.create_time', 0)
    login_time = data.get('base.login_time', 0)
    online_time = data.get('base.online_time', 0)
    
    print(f"角色名: {nickname or '未知'}")
    print(f"门派: {get_school_name(school_id)}")
    print(f"等级: {level}")
    print(f"修为: {max_xiuwei}")
    print(f"账号: {account}")
    print(f"编号: {number_id}")
    print(f"创建时间: {format_timestamp(create_time)}")
    print(f"最后登录: {format_timestamp(login_time)}")
    print(f"在线时长: {format_duration(online_time)}")
    
    club_name = data.get('club.club_name', '')
    if club_name:
        print(f"帮会: {club_name}")
    
    achievement = data.get('achievement.quantity', {})
    if achievement:
        print(f"成就: 金{achievement.get('1', 0)} 银{achievement.get('2', 0)} 铜{achievement.get('3', 0)}")
    
    print("\n" + "=" * 80)
    print("【2】角色面板属性")
    print("=" * 80)
    
    real_attr_keys = ['real_attr.CON', 'real_attr.STR', 'real_attr.CRI', 'real_attr.BAS', 'real_attr.AGI', 
                      'real_attr.XIUWEI_KUNGFU']
    has_attr = False
    
    for key in real_attr_keys:
        if key in data:
            has_attr = True
            attr_key = key.split('.')[-1]
            attr_name = get_attr_name(attr_key)
            value = data[key]
            if isinstance(value, float):
                if value > 1:
                    print(f"  {attr_name}: {value:.1f}")
                else:
                    print(f"  {attr_name}: {value:.3f}")
            else:
                print(f"  {attr_name}: {value}")
    
    if not has_attr:
        # 尝试查找其他可能的属性
        for key in data:
            if key.startswith('real_attr.'):
                has_attr = True
                attr_key = key.split('.')[-1]
                attr_name = get_attr_name(attr_key)
                value = data[key]
                if isinstance(value, float):
                    if value > 1:
                        print(f"  {attr_name}: {value:.1f}")
                    else:
                        print(f"  {attr_name}: {value:.3f}")
                else:
                    print(f"  {attr_name}: {value}")
    
    if not has_attr:
        print("  暂无面板属性数据")
    
    print("\n" + "=" * 80)
    print("【3】角色装备列表")
    print("=" * 80)
    
    equipments = []
    wear_equips = data.get('combat_plan.wear_equips', {})
    
    if wear_equips:
        for slot, equip_data in wear_equips.items():
            equip_no = equip_data.get('No', 0)
            suffix_id = equip_data.get('suffix', 0)
            equip_name = get_equip_name(equip_no)
            suffix_name = get_suffix_name(suffix_id)
            
            ex = equip_data.get('ex', {})
            base_attrs = ex.get('base_attrs', {})
            base_affixes = ex.get('base_affixes', [])
            
            # 构建装备信息
            equip_info = {
                'slot': slot,
                'no': equip_no,
                'name': equip_name,
                'suffix': suffix_name,
                'suffix_id': suffix_id,
                'durability': ex.get('durability', 0),
                'retoned': ex.get('retoned', 0),
                'safe_lock': ex.get('safe_lock', False),
                'base_attrs': base_attrs,
                'base_affixes': base_affixes
            }
            equipments.append(equip_info)
            
            # 输出装备信息
            print(f"\n【装备{slot}】{equip_name} - {suffix_name}")
            print(f"  耐久度: {ex.get('durability', 0)}, 重铸次数: {ex.get('retoned', 0)}")
            
            if base_attrs:
                print(f"  基础属性:")
                for attr_key, attr_value in base_attrs.items():
                    attr_name = get_attr_name(attr_key)
                    print(f"    {attr_name}: {attr_value}")
            
            if base_affixes:
                print(f"  词缀 ({len(base_affixes)} 条):")
                for affix in base_affixes:
                    if len(affix) >= 4:
                        affix_id = affix[0]
                        affix_value = affix[1]
                        affix_rate = round(affix[2] * 100, 2)
                        affix_quality = affix[3]
                        is_max = affix[4] if len(affix) > 4 else False
                        
                        affix_name = get_affix_name(affix_id)
                        quality_name = QUALITY_COLORS.get(affix_quality, f"品质{affix_quality}")
                        
                        max_marker = " [满]" if is_max else ""
                        print(f"    ● {quality_name} {affix_name}: {affix_value} (满度{affix_rate}%){max_marker}")
    
    else:
        print("  暂无装备数据")
    
    # 保存解析后的数据
    result = {
        'capture_time': datetime.now().isoformat(),
        'character_info': {
            'base': {
                'account': account,
                'nickname': nickname,
                'number_id': number_id,
                'level': level,
                'school': get_school_name(school_id),
                'school_id': school_id,
                'max_xiuwei_kungfu': max_xiuwei
            },
            'equipments': equipments
        }
    }
    
    # 添加面板属性
    real_attr_result = {}
    for key in data:
        if key.startswith('real_attr.'):
            attr_key = key.split('.')[-1]
            real_attr_result[get_attr_name(attr_key)] = data[key]
    result['character_info']['real_attr'] = real_attr_result
    
    output_file = 'captured_data/parsed_character.json'
    os.makedirs('captured_data', exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print(f"✓ 解析完成！数据已保存到: {output_file}")
    print("=" * 80)
    
    return result

if __name__ == "__main__":
    raw_file = 'captured_data/raw_20260528_192828.json'
    if os.path.exists(raw_file):
        parse_character_data(raw_file)
    else:
        print(f"✗ 找不到原始数据文件: {raw_file}")
        print("请确保captured_data目录下存在原始数据文件")
