#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量下载配置文件中的图片
"""
import json
import os
import urllib.request
from pathlib import Path
import time

def download_image(url, save_path):
    """下载单个图片"""
    if not url or url.strip() == "":
        return False
    
    try:
        # 添加User-Agent来避免被拒绝
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=30) as response:
            image_data = response.read()
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, 'wb') as f:
                f.write(image_data)
        return True
    except Exception as e:
        print(f"  下载失败: {url}")
        print(f"  错误: {e}")
        return False

def get_file_extension(url):
    """从URL获取文件扩展名"""
    if '.' in url.split('/')[-1]:
        ext = url.split('.')[-1].lower()
        if ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
            return ext
    return 'png'  # 默认用png

def main():
    # 配置文件路径
    equip_file = 'tools/config_data/equip_data.json'
    suffix_file = 'tools/config_data/suffix_data.json'
    xinfa_file = 'tools/config_data/xinfa_data.json'
    
    # 图片保存目录
    img_dir = 'img'
    os.makedirs(img_dir, exist_ok=True)
    
    # 创建子目录
    equip_dir = os.path.join(img_dir, 'equip')
    suffix_dir = os.path.join(img_dir, 'suffix')
    os.makedirs(equip_dir, exist_ok=True)
    os.makedirs(suffix_dir, exist_ok=True)
    
    print("=" * 80)
    print("开始下载图片")
    print("=" * 80)
    
    # 处理套装数据
    if os.path.exists(suffix_file):
        print(f"\n【1】处理套装数据: {suffix_file}")
        with open(suffix_file, 'r', encoding='utf-8') as f:
            suffix_data = json.load(f)
        
        total = len(suffix_data)
        success = 0
        for idx, (item_id, item) in enumerate(suffix_data.items(), 1):
            icon_url = item.get('icon', '')
            if icon_url:
                ext = get_file_extension(icon_url)
                save_path = os.path.join(suffix_dir, f"{item_id}.{ext}")
                
                print(f"[{idx}/{total}] 下载套装: {item.get('name', item_id)}")
                if download_image(icon_url, save_path):
                    print(f"  已保存: {save_path}")
                    success += 1
                time.sleep(0.1)  # 避免请求过快
        
        print(f"\n套装图片下载完成: {success}/{total}")
    
    # 处理装备数据
    if os.path.exists(equip_file):
        print(f"\n【2】处理装备数据: {equip_file}")
        with open(equip_file, 'r', encoding='utf-8') as f:
            equip_data = json.load(f)
        
        total = len(equip_data)
        success = 0
        for idx, (item_id, item) in enumerate(equip_data.items(), 1):
            long_url = item.get('longImage', '')
            short_url = item.get('shortImage', '')
            
            print(f"[{idx}/{total}] 下载装备: {item.get('name', item_id)}")
            
            # 下载长图
            if long_url:
                ext = get_file_extension(long_url)
                long_path = os.path.join(equip_dir, f"{item_id}_long.{ext}")
                if download_image(long_url, long_path):
                    print(f"  长图已保存: {long_path}")
            
            # 下载短图
            if short_url:
                ext = get_file_extension(short_url)
                short_path = os.path.join(equip_dir, f"{item_id}_short.{ext}")
                if download_image(short_url, short_path):
                    print(f"  短图已保存: {short_path}")
            
            success += 1
            time.sleep(0.1)  # 避免请求过快
        
        print(f"\n装备图片下载完成: {success}/{total}")
    
    print("\n" + "=" * 80)
    print("所有图片下载完成！")
    print(f"图片保存在: {os.path.abspath(img_dir)}")
    print("=" * 80)

if __name__ == '__main__':
    main()
