#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试数据解析问题
"""
import json

def unflatten_dict(data: dict, sep: str = '.') -> dict:
    """将点号分隔的扁平字典转换为嵌套字典"""
    result = {}
    for key, value in data.items():
        parts = key.split(sep)
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result

# 读取原始数据
with open('captured_data/raw_20260528_192828.json', 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

print("原始数据结构:")
print(f"  - 顶级键: {list(raw_data.keys())}")
print(f"  - data 类型: {type(raw_data.get('data'))}")
print(f"  - data 是否为字典: {isinstance(raw_data.get('data'), dict)}")
print()

# 检查 data 字段
data_field = raw_data.get('data', {})
if isinstance(data_field, dict):
    # 检查第一个键
    first_key = next(iter(data_field.keys()), "")
    print(f"  - data 中的第一个键: {repr(first_key)}")
    print(f"  - 第一个键是否包含点号: {'.' in first_key if first_key else False}")
    print()
    
    # 测试转换
    if '.' in first_key:
        print("✓ 检测到点号分隔格式，开始转换...")
        converted = unflatten_dict(data_field)
        
        print("\n转换后的结构:")
        print(f"  - base 键存在: {'base' in converted}")
        print(f"  - base.level: {converted.get('base', {}).get('level', 'NOT FOUND')}")
        print(f"  - base.nickname: {converted.get('base', {}).get('nickname', 'NOT FOUND')}")
        print(f"  - base.school: {converted.get('base', {}).get('school', 'NOT FOUND')}")
        print()
        
        # 保存转换后的数据用于检查
        with open('captured_data/converted_data.json', 'w', encoding='utf-8') as f:
            json.dump(converted, f, ensure_ascii=False, indent=2)
        print("✓ 转换后的数据已保存到 converted_data.json")
        
    else:
        print("✗ 未检测到点号分隔格式")

print()
print("=" * 80)
print("检查完成")
print("=" * 80)
