#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
验证配置文件是否正确
"""
import json
import os

print("=" * 80)
print("验证配置文件")
print("=" * 80)
print()

# 验证门派配置
print("1. 门派配置 (school_data.json):")
print("-" * 80)
if os.path.exists('config_data/school_data.json'):
    with open('config_data/school_data.json', 'r', encoding='utf-8') as f:
        school_data = json.load(f)
    
    print(f"总共 {len(school_data)} 个门派")
    print()
    
    # 检查关键门派
    test_schools = [100, 1, 2, 3]
    for school_id in test_schools:
        school_info = school_data.get(str(school_id))
        if school_info:
            print(f"  ID {school_id}: {school_info.get('name', 'Unknown')}")
        else:
            print(f"  ID {school_id}: [缺少]")
else:
    print("  [文件不存在]")

print()

# 验证套装配置
print("2. 套装配置 (suffix_data.json):")
print("-" * 80)
if os.path.exists('config_data/suffix_data.json'):
    with open('config_data/suffix_data.json', 'r', encoding='utf-8') as f:
        suffix_data = json.load(f)
    
    print(f"总共 {len(suffix_data)} 个套装")
    print()
    
    # 检查关键套装
    test_suffixes = [7, 12, 45, 1, 2]
    for suffix_id in test_suffixes:
        suffix_info = suffix_data.get(str(suffix_id))
        if suffix_info:
            print(f"  ID {suffix_id}: {suffix_info.get('name', 'Unknown')} (简写: {suffix_info.get('short', 'Unknown')})")
        else:
            print(f"  ID {suffix_id}: [缺少]")
else:
    print("  [文件不存在]")

print()

# 验证装备配置
print("3. 装备配置 (equip_data.json):")
print("-" * 80)
if os.path.exists('config_data/equip_data.json'):
    with open('config_data/equip_data.json', 'r', encoding='utf-8') as f:
        equip_data = json.load(f)
    
    print(f"总共 {len(equip_data)} 个装备")
    print()
    
    # 检查一些装备
    test_equips = [1101877, 1101865, 1101874]
    for equip_no in test_equips:
        equip_info = equip_data.get(str(equip_no))
        if equip_info:
            print(f"  No {equip_no}: {equip_info.get('name', 'Unknown')}")
        else:
            print(f"  No {equip_no}: [缺少]")
else:
    print("  [文件不存在]")

print()
print("=" * 80)
print("验证完成")
print("=" * 80)
