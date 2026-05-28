#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试工具 - 查看已捕获数据的原始结构
"""
import json
import os

print("=" * 80)
print("查看已捕获数据")
print("=" * 80)

captured_dir = "captured_data"
if not os.path.exists(captured_dir):
    print(f"目录不存在: {captured_dir}")
    exit(1)

files = sorted([f for f in os.listdir(captured_dir) if f.startswith("character_") and f.endswith(".json")])

if not files:
    print("没有找到已捕获的文件")
else:
    print(f"找到 {len(files)} 个文件:")
    print()
    
    for f in files:
        print(f"  - {f}")
    
    print()
    print("=" * 80)
    print(f"最新文件: {files[-1]}")
    print("=" * 80)
    
    filepath = os.path.join(captured_dir, files[-1])
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print()
    print("顶层键:", list(data.keys()))
    print()
    
    if 'base' in data:
        print("base 键:", list(data['base'].keys()))
        print()
        print("  base 完整内容:")
        print(json.dumps(data['base'], ensure_ascii=False, indent=4))
        print()
    
    if 'combat_plan' in data:
        print("combat_plan 键:", list(data['combat_plan'].keys()))
        print()
        print("  combat_plan 完整内容:")
        print(json.dumps(data['combat_plan'], ensure_ascii=False, indent=4))
        print()
    
    if 'equipment' in data:
        print(f"equipment 数量: {len(data['equipment'])}")
        print()
        if data['equipment']:
            print("第一个装备:")
            print(json.dumps(data['equipment'][0], ensure_ascii=False, indent=4))

print()
print("=" * 80)
print("调试完成")
print("=" * 80)
