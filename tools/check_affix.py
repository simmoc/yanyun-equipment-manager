#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查配置文件是否有JSON格式错误
"""
import json
import os

def check_json_file(filepath):
    """检查JSON文件是否有格式错误"""
    print(f"检查文件: {filepath}")
    print(f"文件大小: {os.path.getsize(filepath)} bytes")
    print()
    
    # 尝试读取文件
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"读取内容长度: {len(content)} 字符")
    print()
    
    # 检查末尾内容
    print("文件末尾内容 (最后200字符):")
    print(repr(content[-200:]))
    print()
    
    # 尝试解析
    try:
        data = json.loads(content)
        print(f"✅ JSON解析成功！共 {len(data)} 个条目")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析失败:")
        print(f"错误类型: {e.msg}")
        print(f"错误位置: 第 {e.lineno} 行, 第 {e.colno} 列")
        print(f"字符位置: 第 {e.pos} 个字符")
        print()
        
        # 显示错误位置附近的内容
        start = max(0, e.pos - 100)
        end = min(len(content), e.pos + 100)
        error_context = content[start:end]
        
        print("错误位置附近的内容:")
        print(repr(error_context))
        print()
        
        return False

# 检查文件
check_json_file('config_data/affix_data.json')
