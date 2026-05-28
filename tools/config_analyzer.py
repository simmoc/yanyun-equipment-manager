#!/usr/bin/env python3
import json
import os
from pathlib import Path

CONFIG_DIR = "config_data"

def analyze_json_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n{'='*60}")
        print(f"文件: {filepath}")
        print(f"{'='*60}")
        print(f"数据类型: {type(data).__name__}")
        
        if isinstance(data, dict):
            print(f"键数量: {len(data)}")
            print(f"\n前5个键值对:")
            for i, (key, value) in enumerate(list(data.items())[:5]):
                if isinstance(value, dict):
                    print(f"  {key}: {list(value.keys())[:5]}...")
                else:
                    print(f"  {key}: {value}")
                    
            print(f"\n示例数据结构:")
            first_key = list(data.keys())[0]
            first_value = data[first_key]
            print(json.dumps(first_value, ensure_ascii=False, indent=2)[:500])
            
        elif isinstance(data, list):
            print(f"列表长度: {len(data)}")
            if data:
                print(f"\n第一个元素:")
                print(json.dumps(data[0], ensure_ascii=False, indent=2)[:500])
        
        return True
        
    except Exception as e:
        print(f"\n分析 {filepath} 时出错: {e}")
        return False

def main():
    print("燕云游戏配置文件分析工具")
    print("=" * 60)
    
    if not os.path.exists(CONFIG_DIR):
        print(f"\n配置文件目录不存在: {CONFIG_DIR}")
        print("请先运行: python config_downloader.py")
        return
    
    config_files = [
        os.path.join(CONFIG_DIR, "suffix_data.json"),
        os.path.join(CONFIG_DIR, "school_data.json"),
        os.path.join(CONFIG_DIR, "equip_data.json")
    ]
    
    for filepath in config_files:
        if os.path.exists(filepath):
            analyze_json_file(filepath)
        else:
            print(f"\n文件不存在: {filepath}")
    
    print(f"\n{'='*60}")
    print("分析完成")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
