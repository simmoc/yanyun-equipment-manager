#!/usr/bin/env python3
import requests
import json
import os
from typing import Dict, Any

CONFIG_URLS = {
    "suffix_data": "https://s.166.net/config/ds_h72/suffix_data.json",
    "school_data": "https://s.166.net/config/ds_h72/school_data.json",
    "equip_data": "https://s.166.net/config/ds_h72/equip_data.json"
}

CONFIG_DIR = "config_data"

class ConfigDownloader:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        os.makedirs(CONFIG_DIR, exist_ok=True)
    
    def download_config(self, config_name: str, url: str) -> Dict[str, Any]:
        try:
            print(f"正在下载 {config_name}...")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            output_file = os.path.join(CONFIG_DIR, f"{config_name}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"✓ {config_name} 下载成功 ({len(data)} 条记录)")
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"✗ {config_name} 下载失败: {e}")
            return {}
        except json.JSONDecodeError as e:
            print(f"✗ {config_name} JSON解析失败: {e}")
            return {}
    
    def download_all(self) -> Dict[str, Any]:
        configs = {}
        for name, url in CONFIG_URLS.items():
            configs[name] = self.download_config(name, url)
        return configs
    
    def load_local(self, config_name: str) -> Dict[str, Any]:
        filepath = os.path.join(CONFIG_DIR, f"{config_name}.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return {}
    
    def load_all_local(self) -> Dict[str, Any]:
        configs = {}
        for name in CONFIG_URLS.keys():
            configs[name] = self.load_local(name)
        return configs

class ConfigParser:
    def __init__(self):
        self.downloader = ConfigDownloader()
        self.suffix_data = {}
        self.school_data = {}
        self.equip_data = {}
        self.load_configs()
    
    def load_configs(self):
        print("=" * 50)
        print("加载配置文件...")
        print("=" * 50)
        
        local_configs = self.downloader.load_all_local()
        
        if any(local_configs.values()):
            print("从本地加载已有配置...")
            self.suffix_data = local_configs.get('suffix_data', {})
            self.school_data = local_configs.get('school_data', {})
            self.equip_data = local_configs.get('equip_data', {})
            print("✓ 本地配置加载完成")
        else:
            print("本地无配置，开始下载...")
            self.download_configs()
    
    def download_configs(self):
        print("=" * 50)
        print("下载燕云游戏配置数据...")
        print("=" * 50)
        
        configs = self.downloader.download_all()
        self.suffix_data = configs.get('suffix_data', {})
        self.school_data = configs.get('school_data', {})
        self.equip_data = configs.get('equip_data', {})
        
        print("=" * 50)
        print("配置下载完成！")
        print("=" * 50)
    
    def get_suffix_name(self, suffix_id: int) -> str:
        if isinstance(self.suffix_data, dict):
            suffix_info = self.suffix_data.get(str(suffix_id), self.suffix_data.get(suffix_id))
            if isinstance(suffix_info, dict):
                return suffix_info.get('name', f'套装{suffix_id}')
            elif isinstance(suffix_info, str):
                return suffix_info
        return f'套装{suffix_id}'
    
    def get_school_name(self, school_id: int) -> str:
        if isinstance(self.school_data, dict):
            school_info = self.school_data.get(str(school_id), self.school_data.get(school_id))
            if isinstance(school_info, dict):
                return school_info.get('name', f'门派{school_id}')
            elif isinstance(school_info, str):
                return school_info
        return f'门派{school_id}'
    
    def get_equip_name(self, equip_no: int) -> str:
        equip_str = str(equip_no)
        
        if isinstance(self.equip_data, dict):
            equip_info = self.equip_data.get(equip_str, self.equip_data.get(equip_no))
            if isinstance(equip_info, dict):
                return equip_info.get('name', self.guess_equip_name(equip_no))
            elif isinstance(equip_info, str):
                return equip_info
        
        return self.guess_equip_name(equip_no)
    
    def guess_equip_name(self, equip_no: int) -> str:
        equip_ranges = {
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
            (1100600, 1100699): "护腕(副)",
            (1100500, 1100599): "腰带(副)",
            (1100400, 1100499): "护腿(副)",
            (1100300, 1100399): "护胸(副)",
            (1100200, 1100299): "头盔(副)",
            (1100100, 1100199): "项链(副)",
            (1100000, 1100099): "戒指(副)",
            (1101900, 1101999): "副手",
            (2402000, 2402099): "时装",
            (106, 106): "通用武器",
            (206, 206): "通用武器"
        }
        
        for (start, end), name in equip_ranges.items():
            if start <= equip_no <= end:
                return name
        
        return f"装备{equip_no}"
    
    def parse_affix_name(self, affix_id: int) -> str:
        affix_names = {
            10613002: "外功攻击",
            10693002: "内功攻击",
            10693021: "会心伤害",
            10693012: "会心几率",
            10693008: "攻击力",
            300701: "词缀主属性",
            10633001: "内功攻击",
            10693108: "内功攻击",
            10693121: "会心伤害",
            10693118: "会心几率",
            10693117: "内功攻击",
            10633002: "内功攻击",
            10693104: "内功攻击",
            10693107: "内功攻击",
            10673002: "弓箭伤害",
            10683003: "穿刺",
            10683010: "弓箭攻击",
            10683004: "破甲",
            10683006: "会心",
            10643004: "防御",
            10693119: "生命值",
            10693102: "内功攻击",
            10652007: "弓箭伤害",
            10694108: "内功攻击",
            10694124: "会心伤害",
            10694102: "内功攻击",
            10694119: "生命值",
            10672002: "弓箭增伤",
            10684003: "穿刺",
            10684002: "弓箭攻击",
            10684004: "破甲",
            10684006: "会心"
        }
        return affix_names.get(affix_id, f"词缀{affix_id}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='燕云游戏配置下载工具')
    parser.add_argument('--download', action='store_true', help='强制重新下载配置')
    parser.add_argument('--check', action='store_true', help='检查本地配置')
    args = parser.parse_args()
    
    config_parser = ConfigParser()
    
    if args.download:
        print("\n强制重新下载所有配置...")
        config_parser.download_configs()
    elif args.check:
        print("\n检查本地配置...")
        local_path = os.path.join(CONFIG_DIR)
        if os.path.exists(local_path):
            files = os.listdir(local_path)
            if files:
                print(f"本地配置: {', '.join(files)}")
            else:
                print("本地无配置")
        else:
            print("本地无配置目录")
    else:
        print("\n使用默认配置启动...")
        if config_parser.suffix_data:
            print(f"套装配置: {len(config_parser.suffix_data)} 条")
        if config_parser.school_data:
            print(f"门派配置: {len(config_parser.school_data)} 条")
        if config_parser.equip_data:
            print(f"装备配置: {len(config_parser.equip_data)} 条")

if __name__ == "__main__":
    main()
