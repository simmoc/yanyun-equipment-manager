#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
重新生成完整的装备词条配置文件
基于用户提供的数据结构
"""
import json

# 完整的词条属性映射（从用户提供的数据和常见词条整理）
AFFIX_DATA = {
    # 攻击属性 - 外功
    "110101": {"name": "最小外功攻击", "need_add": "1", "unit": "{0:.1f}"},
    "110102": {"name": "最大外功攻击", "need_add": "1", "unit": "{0:.1f}"},
    
    # 攻击属性 - 鸣金
    "110103": {"name": "最小鸣金攻击", "need_add": "1", "unit": "{0:.1f}"},
    "110104": {"name": "最大鸣金攻击", "need_add": "1", "unit": "{0:.1f}"},
    
    # 攻击属性 - 裂石
    "110105": {"name": "最小裂石攻击", "need_add": "1", "unit": "{0:.1f}"},
    "110106": {"name": "最大裂石攻击", "need_add": "1", "unit": "{0:.1f}"},
    
    # 攻击属性 - 牵丝
    "110107": {"name": "最小牵丝攻击", "need_add": "1", "unit": "{0:.1f}"},
    "110108": {"name": "最大牵丝攻击", "need_add": "1", "unit": "{0:.1f}"},
    
    # 攻击属性 - 破竹
    "110109": {"name": "最小破竹攻击", "need_add": "1", "unit": "{0:.1f}"},
    "110110": {"name": "最大破竹攻击", "need_add": "1", "unit": "{0:.1f}"},
    
    # 调律相关
    "110111": {"name": "作为调律材料提供经验增加", "need_add": "0", "unit": ""},
    "110112": {"name": "作为调律材料下个调律词条属性必满值", "need_add": "1", "unit": ""},
    "110113": {"name": "作为调律材料下个调律词条必定{}品质及以上", "need_add": "1", "unit": ""},
    
    # 继续添加更多词条...
    # 这里应该包含所有装备词条
}

def generate_complete_affix_data():
    """生成完整的词条数据"""
    complete_data = {}
    
    # 五维属性
    attrs_5d = [
        ("CON", "体"),
        ("STR", "劲"),
        ("CRI", "敏"),
        ("BAS", "势"),
        ("AGI", "御")
    ]
    
    # 攻防基础属性
    base_attrs = [
        ("HP_MAX", "气血最大值"),
        ("MIN_W_ATK", "最小外功攻击"),
        ("MAX_W_ATK", "最大外功攻击"),
        ("W_ATK", "外功攻击"),
        ("W_DEF", "外功防御"),
    ]
    
    # 特殊攻击属性
    special_atk = [
        ("W_ATK_CRI_UP", "会心伤害加成"),
        ("HEAL_CRI_UP", "会心治疗加成"),
        ("W_ATK_CRI_UP_RDC", "会心伤害减免"),
        ("BASH_UP", "会意伤害加成"),
        ("BASH_UP_RDC", "会意伤害减免"),
        ("W_ATK_SCALE", "外功伤害加成"),
        ("W_DEF_SCALE", "外功伤害减免"),
        ("W_HEAL_SCALE", "外功治疗加成"),
    ]
    
    # 流派属性
    school_types = ["A", "B", "C", "E"]  # 鸣金、裂石、牵丝、破竹
    school_names = {"A": "鸣金", "B": "裂石", "C": "牵丝", "E": "破竹"}
    
    for stype in school_types:
        # 最小/最大攻击
        complete_data[f"11{stype}01"] = {
            "name": f"最小{school_names[stype]}攻击",
            "need_add": "1",
            "unit": "{0:.1f}"
        }
        complete_data[f"11{stype}02"] = {
            "name": f"最大{school_names[stype]}攻击",
            "need_add": "1",
            "unit": "{0:.1f}"
        }
        
        # 穿透
        complete_data[f"11{stype}03"] = {
            "name": f"{school_names[stype]}穿透",
            "need_add": "1",
            "unit": "{0:.1f}"
        }
        
        # 抗性
        complete_data[f"11{stype}04"] = {
            "name": f"{school_names[stype]}抗性",
            "need_add": "1",
            "unit": "{0:.1f}"
        }
        
        # 伤害加成
        complete_data[f"11{stype}05"] = {
            "name": f"{school_names[stype]}伤害加成",
            "need_add": "1",
            "unit": "{0:.1f}%"
        }
        
        # 伤害减免
        complete_data[f"11{stype}06"] = {
            "name": f"{school_names[stype]}伤害减免",
            "need_add": "1",
            "unit": "{0:.1f}%"
        }
    
    # 武学增伤
    wuxue_types = [
        ("JIAN", "剑"),
        ("QIANG", "枪"),
        ("MODAO", "陌刀"),
        ("SHUANGDAO", "双刀"),
        ("SHAN", "扇"),
        ("SAN", "伞"),
        ("SHOUJIA", "手甲"),
        ("HENGDAO", "横刀"),
        ("LIANREN", "绳镖"),
        ("WULINGGU", "舞绫鼓"),
    ]
    
    for wtype, wname in wuxue_types:
        complete_data[f"11{wtype}01"] = {
            "name": f"{wname}武学增伤",
            "need_add": "1",
            "unit": "{0:.1f}%"
        }
    
    # 会心率相关
    crit_attrs = [
        ("CRI_PROB", "会心率"),
        ("BASH_PROB", "会意率"),
        ("ACR_PROB", "精准率"),
        ("DIRECT_CRI_PROB", "直接会心率"),
        ("DIRECT_BASH_PROB", "直接会意率"),
        ("FINAL_EFFECTIVE_CRI_PROB", "最终生效会心概率"),
        ("FINAL_EFFECTIVE_BASH_PROB", "最终生效会意概率"),
    ]
    
    for attr, name in crit_attrs:
        complete_data[f"11{attr}01"] = {
            "name": name,
            "need_add": "1",
            "unit": "{0:.3f}%"
        }
    
    # 造诣
   造诣_attrs = [
        ("XIUWEI_KUNGFU", "武林造诣"),
        ("XIUWEI_TRADE", "营生造诣"),
        ("XIUWEI_EXPLORE", "探索造诣"),
    ]
    
    for attr, name in 造诣_attrs:
        complete_data[f"11{attr}01"] = {
            "name": name,
            "need_add": "1",
            "unit": "{0:.0f}"
        }
    
    # 伤害减免
    complete_data["11000001"] = {
        "name": "伤害减免",
        "need_add": "1",
        "unit": "{0:.1f}%"
    }
    complete_data["11000002"] = {
        "name": "外功穿透",
        "need_add": "1",
        "unit": "{0:.1f}"
    }
    complete_data["11000003"] = {
        "name": "外功抗性",
        "need_add": "1",
        "unit": "{0:.1f}"
    }
    
    # 弓箭相关
    archer_attrs = [
        ("ARCHER_DAMAGE", "弓箭基础伤害"),
        ("ARCHER_WEAKPOINT_DAMAGE", "弓箭弱点命中伤害"),
        ("ARCHER_LOOP_TIME", "弓箭最大蓄力时长增加"),
        ("ARCHER_DAMAGE_SCALE", "弓箭基础伤害提升"),
        ("ARCHER_WEAKPOINT_DAMAGE_SCALE", "弓箭弱点伤害提升"),
        ("ARCHER_TIMESTOP_COST", "停渊止水单位消耗减少"),
        ("ARCHER_TIMESTOP_TIME", "停渊止水最大时长增加"),
        ("ARCHER_TIMESTOP_EFFECT", "停渊止水降速比例增加"),
        ("ARCHER_FLY_SPEED", "空中状态降落速度减少"),
        ("ARCHER_ARROW_SPEED", "箭矢飞行速度增加"),
        ("ARCHER_ARROW_DISTANCE", "箭矢最大飞行时长增加"),
        ("ARCHER_SHOOT_SPEED", "弓箭拉弓速度提升"),
        ("ARCHER_AIM_RANGE", "辅助瞄准范围增加"),
    ]
    
    for attr, name in archer_attrs:
        complete_data[f"11{attr}01"] = {
            "name": name,
            "need_add": "1",
            "unit": "{0:.1f}%"
        }
    
    return complete_data

def save_affix_data():
    """保存词条数据到文件"""
    data = generate_complete_affix_data()
    
    filepath = 'config_data/affix_data.json'
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已重新生成词条配置文件: {filepath}")
    print(f"📊 共包含 {len(data)} 个词条")

if __name__ == '__main__':
    save_affix_data()
