from mitmproxy import http, ctx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import threading
import time
import requests

TARGET_URL = "datamsapi.ds.163.com"
TARGET_PATH = "/v1/h72roletool/proxyGameRole"
SAVE_DIR = "captured_data"
CONFIG_URLS = {
    "suffix_data": "https://s.166.net/config/ds_h72/suffix_data.json",
    "school_data": "https://s.166.net/config/ds_h72/school_data.json",
    "equip_data": "https://s.166.net/config/ds_h72/equip_data.json"
}
CONFIG_DIR = "config_data"

class ConfigManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.suffix_data = {}
        self.school_data = {}
        self.equip_data = {}
        self.affix_names = {}
        self.kongfu_names = {}
        self.xinfa_names = {}
        self._initialized = True
        
        self.load_or_download_configs()
    
    def load_or_download_configs(self):
        os.makedirs(CONFIG_DIR, exist_ok=True)
        
        local_loaded = self.load_local_configs()
        
        if not local_loaded:
            ctx.log.info("正在下载配置文件...")
            self.download_configs()
    
    def load_local_configs(self) -> bool:
        loaded_any = False
        
        for config_name in CONFIG_URLS.keys():
            filepath = os.path.join(CONFIG_DIR, f"{config_name}.json")
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if config_name == 'suffix_data':
                            self.suffix_data = data
                        elif config_name == 'school_data':
                            self.school_data = data
                        elif config_name == 'equip_data':
                            self.equip_data = data
                    loaded_any = True
                except Exception as e:
                    ctx.log.error(f"加载 {config_name} 失败: {e}")
        
        self.init_affix_names()
        return loaded_any
    
    def download_configs(self):
        for config_name, url in CONFIG_URLS.items():
            try:
                ctx.log.info(f"下载 {config_name}...")
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                filepath = os.path.join(CONFIG_DIR, f"{config_name}.json")
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                if config_name == 'suffix_data':
                    self.suffix_data = data
                elif config_name == 'school_data':
                    self.school_data = data
                elif config_name == 'equip_data':
                    self.equip_data = data
                
                ctx.log.info(f"✓ {config_name} 下载成功")
                
            except Exception as e:
                ctx.log.error(f"下载 {config_name} 失败: {e}")
        
        self.init_affix_names()
    
    def init_affix_names(self):
        self.affix_names = {
            10613002: "外功攻击", 10693002: "内功攻击", 10693021: "会心伤害",
            10693012: "会心几率", 10693008: "攻击力", 300701: "词缀主属性",
            10633001: "内功攻击", 10693108: "内功攻击", 10693121: "会心伤害",
            10693118: "会心几率", 10693117: "内功攻击", 10633002: "内功攻击",
            10693104: "内功攻击", 10693107: "内功攻击", 10673002: "弓箭伤害",
            10683003: "穿刺", 10683010: "弓箭攻击", 10683004: "破甲",
            10683006: "会心", 10643004: "防御", 10693119: "生命值",
            10693102: "内功攻击", 10652007: "弓箭伤害", 10694108: "内功攻击",
            10694124: "会心伤害", 10694102: "内功攻击", 10694119: "生命值",
            10672002: "弓箭增伤", 10684003: "穿刺", 10684002: "弓箭攻击",
            10684004: "破甲", 10684006: "会心"
        }
        
        self.kongfu_names = {
            20603: "天地无极", 20702: "九宫飞星",
            20501: "不动如山", 20502: "疾风步",
            20601: "万剑归宗", 20701: "天罗地网"
        }
        
        self.xinfa_names = {
            501: "内功心法", 502: "外功心法", 504: "身法心法",
            81: "基础心法", 502: "医术心法", 503: "毒术心法"
        }
    
    def get_suffix_name(self, suffix_id: int) -> str:
        if not self.suffix_data:
            return f"套装{suffix_id}"
        
        suffix_info = self.suffix_data.get(str(suffix_id), self.suffix_data.get(suffix_id))
        if isinstance(suffix_info, dict):
            return suffix_info.get('name', f'套装{suffix_id}')
        elif isinstance(suffix_info, str):
            return suffix_info
        return f'套装{suffix_id}'
    
    def get_school_name(self, school_id: int) -> str:
        if not self.school_data:
            return self.get_default_school_name(school_id)
        
        school_info = self.school_data.get(str(school_id), self.school_data.get(school_id))
        if isinstance(school_info, dict):
            return school_info.get('name', self.get_default_school_name(school_id))
        elif isinstance(school_info, str):
            return school_info
        return self.get_default_school_name(school_id)
    
    def get_default_school_name(self, school_id: int) -> str:
        schools = {
            1: "君子", 2: "武士", 3: "刺客", 4: "侠客", 5: "医生",
            6: "琵琶", 7: "钜子", 8: "天曜", 9: "青牙", 10: "何不留",
            11: "毒奶", 12: "醉拳", 13: "明灭", 14: "千恩", 15: "云寒", 16: "武学"
        }
        return schools.get(school_id, f"门派{school_id}")
    
    def get_equip_name(self, equip_no: int) -> str:
        equip_str = str(equip_no)
        
        if self.equip_data:
            equip_info = self.equip_data.get(equip_str, self.equip_data.get(equip_no))
            if isinstance(equip_info, dict):
                name = equip_info.get('name')
                if name:
                    return name
        
        return self.guess_equip_name(equip_no)
    
    def guess_equip_name(self, equip_no: int) -> str:
        equip_ranges = {
            (1101800, 1101899): "武器", (1101700, 1101799): "护腕",
            (1101600, 1101699): "护肩", (1101500, 1101599): "腰带",
            (1101400, 1101499): "护腿", (1101300, 1101399): "护胸",
            (1101200, 1101299): "头盔", (1101100, 1101199): "项链",
            (1101000, 1101099): "戒指1", (1100900, 1100999): "戒指2",
            (1100800, 1100899): "披风", (1100700, 1100799): "护心",
            (1100600, 1100699): "护腕(副)", (1100500, 1100599): "腰带(副)",
            (1100400, 1100499): "护腿(副)", (1100300, 1100399): "护胸(副)",
            (1100200, 1100299): "头盔(副)", (1100100, 1100199): "项链(副)",
            (1100000, 1100099): "戒指(副)", (1101900, 1101999): "副手",
            (2402000, 2402099): "时装"
        }
        
        for (start, end), name in equip_ranges.items():
            if start <= equip_no <= end:
                return name
        
        return f"装备{equip_no}"
    
    def get_affix_name(self, affix_id: int) -> str:
        return self.affix_names.get(affix_id, f"词缀{affix_id}")
    
    def get_kongfu_name(self, kongfu_id: int) -> str:
        return self.kongfu_names.get(kongfu_id, f"功法{kongfu_id}")
    
    def get_xinfa_name(self, xinfa_id: int) -> str:
        return self.xinfa_names.get(xinfa_id, f"心法{xinfa_id}")

class YanYunInterceptor:
    def __init__(self):
        self.captured_data = []
        self.lock = threading.Lock()
        os.makedirs(SAVE_DIR, exist_ok=True)
        
        self.config = ConfigManager()
        
    def request(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            ctx.log.info(f"[*] 捕获请求: {flow.request.pretty_url}")
            
    def response(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            try:
                ctx.log.info(f"[+] 收到响应: {flow.request.pretty_url}")
                
                response_data = flow.response.content.decode('utf-8')
                data = json.loads(response_data)
                
                if data.get('success') and data.get('code') == 0:
                    character_info = self.parse_character_data(data.get('data', {}))
                    self.save_data(character_info)
                    
                    nickname = character_info['base']['nickname']
                    ctx.log.info(f"[✓] 成功解析角色: {nickname}")
                    
            except json.JSONDecodeError as e:
                ctx.log.error(f"[!] JSON解析错误: {e}")
            except Exception as e:
                ctx.log.error(f"[!] 处理响应时出错: {e}")
    
    def parse_character_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        character_info = {
            'capture_time': datetime.now().isoformat(),
            'base': self.extract_base_info(data),
            'combat_plan': self.extract_combat_info(data),
            'equipment': self.extract_equipment_info(data),
            'club': self.extract_club_info(data),
            'real_attr': self.extract_real_attrs(data),
            'achievement': self.extract_achievement(data),
            'common_score': self.extract_common_scores(data),
            'fashion': self.extract_fashion(data),
            'guise': self.extract_guise(data),
            'title': self.extract_title(data),
            'recall': self.extract_recall(data),
            'world_equips': self.extract_world_equips(data)
        }
        return character_info
    
    def extract_base_info(self, data: Dict) -> Dict:
        base = data.get('base', {})
        return {
            'account': data.get('_account_', ''),
            'nickname': base.get('nickname', ''),
            'number_id': base.get('number_id', ''),
            'level': base.get('level', 0),
            'school': self.config.get_school_name(base.get('school', 0)),
            'school_id': base.get('school', 0),
            'create_time': self.format_timestamp(base.get('create_time', 0)),
            'login_time': self.format_timestamp(base.get('login_time', 0)),
            'logout_time': self.format_timestamp(base.get('logout_time', 0)),
            'online_time': self.format_duration(base.get('online_time', 0)),
            'online_seconds': base.get('online_time', 0),
            'max_xiuwei_kungfu': base.get('max_xiuwei_kungfu', 0),
            'recent_online_days': self.extract_recent_online_days(base.get('recent_online_day_time', {})),
            'hostnum': data.get('hostnum', 0)
        }
    
    def extract_combat_info(self, data: Dict) -> Dict:
        combat = data.get('combat_plan', {})
        kongfu_main = combat.get('kongfu', {}).get('kongfu_main', 0)
        kongfu_sub = combat.get('kongfu', {}).get('kongfu_sub', 0)
        
        return {
            'kongfu': {
                'main': self.config.get_kongfu_name(kongfu_main),
                'main_id': kongfu_main,
                'main_level': combat.get('kongfu_level', {}).get('kongfu_main', {}).get('level', 0),
                'sub': self.config.get_kongfu_name(kongfu_sub),
                'sub_id': kongfu_sub,
                'sub_level': combat.get('kongfu_level', {}).get('kongfu_sub', {}).get('level', 0)
            },
            'xinfa': self.extract_xinfa_info(combat.get('xinfa', {})),
            'battle_qs': combat.get('battle_qs', {}),
            'battle_qs_level': combat.get('battle_qs_level', {})
        }
    
    def extract_equipment_info(self, data: Dict) -> list:
        wear_equips = data.get('combat_plan', {}).get('wear_equips', {})
        equipments = []
        
        for slot, equip_data in wear_equips.items():
            equip_no = equip_data.get('No', 0)
            suffix_id = equip_data.get('suffix', 0)
            
            equip = {
                'slot': slot,
                'no': equip_no,
                'name': self.config.get_equip_name(equip_no),
                'suffix': self.config.get_suffix_name(suffix_id),
                'suffix_id': suffix_id,
                'durability': equip_data.get('durability', 0),
                'retoned': equip_data.get('retoned', 0),
                'gain_ts': self.format_timestamp(equip_data.get('gain_ts', 0)),
                'safe_lock': equip_data.get('safe_lock', False),
                'base_attrs': self.format_base_attrs(equip_data.get('base_attrs', {})),
                'base_affixes': self.parse_affixes(equip_data.get('ex', {}).get('base_affixes', []))
            }
            equipments.append(equip)
        
        return equipments
    
    def format_base_attrs(self, attrs: Dict) -> Dict:
        formatted = {}
        attr_names = {
            'MAX_W_ATK': '外功攻击上限',
            'MIN_W_ATK': '外功攻击下限',
            'HP_MAX': '生命上限',
            'W_DEF': '外功防御',
            'ARCHER_DAMAGE': '弓箭伤害',
            'ARCHER_WEAKPOINT_DAMAGE': '弱点伤害'
        }
        
        for key, value in attrs.items():
            formatted[attr_names.get(key, key)] = value
        
        return formatted
    
    def parse_affixes(self, affixes: list) -> list:
        parsed = []
        for affix in affixes:
            if len(affix) >= 4:
                affix_id = affix[0]
                parsed.append({
                    'id': affix_id,
                    'name': self.config.get_affix_name(affix_id),
                    'value': affix[1],
                    'rate': round(affix[2] * 100, 2),
                    'quality': self.get_quality_name(affix[3]),
                    'is_max': affix[4] if len(affix) > 4 else False
                })
        return parsed
    
    def get_quality_name(self, quality: int) -> str:
        qualities = {1: "绿色", 2: "蓝色", 3: "紫色", 4: "橙色", 5: "粉色"}
        return qualities.get(quality, f"品质{quality}")
    
    def extract_club_info(self, data: Dict) -> Dict:
        club = data.get('club', {})
        return {
            'name': club.get('club_name', ''),
            'id': club.get('club_id', ''),
            'hostnum': club.get('hostnum', 0)
        }
    
    def extract_real_attrs(self, data: Dict) -> Dict:
        real_attr = data.get('real_attr', {})
        attr_names = {
            'STR': '力量', 'CON': '体质', 'AGI': '敏捷',
            'BAS': '基础', 'XIUWEI_KUNGFU': '修为功夫', 'CRI': '会心'
        }
        
        formatted = {}
        for key, value in real_attr.items():
            formatted[attr_names.get(key, key)] = value
        
        return formatted
    
    def extract_achievement(self, data: Dict) -> Dict:
        achievement = data.get('achievement.quantity', {})
        return {
            'gold': achievement.get('1', 0),
            'silver': achievement.get('2', 0),
            'bronze': achievement.get('3', 0)
        }
    
    def extract_common_scores(self, data: Dict) -> Dict:
        scores = data.get('common_score_data', {}).get('scores', {})
        return {str(k): v for k, v in scores.items()}
    
    def extract_fashion(self, data: Dict) -> Dict:
        return {
            'score': data.get('fashion', {}).get('score', 0)
        }
    
    def extract_guise(self, data: Dict) -> Dict:
        collection = data.get('guise', {}).get('collection_progress', {})
        return {k: v for k, v in collection.items()}
    
    def extract_title(self, data: Dict) -> Dict:
        titles = data.get('title_prop', {}).get('unlock_titles', {}).get('__', [])
        unlocked = [t[0] for t in titles if t[1] > 0]
        return {
            'unlocked_count': len(unlocked),
            'unlocked_ids': unlocked
        }
    
    def extract_recall(self, data: Dict) -> Dict:
        area_progress = data.get('recall', {}).get('area_progress', {})
        return {k: v for k, v in area_progress.items()}
    
    def extract_world_equips(self, data: Dict) -> list:
        slots = data.get('world_equips', {}).get('slot2lv', [])
        return [{'slot': s[0], 'level': s[1]} for s in slots]
    
    def extract_xinfa_info(self, xinfa: Dict) -> Dict:
        active = xinfa.get('active_slots', [])
        passive = xinfa.get('passive_slots', [])
        xinfa_info = xinfa.get('xinfa_info', {})
        
        parsed_xinfa = {}
        for slot_id, info in xinfa_info.items():
            slot_int = int(slot_id)
            parsed_xinfa[slot_id] = {
                'name': self.config.get_xinfa_name(slot_int),
                'rank': info.get('rank', 0)
            }
        
        return {
            'active': active,
            'passive': passive,
            'details': parsed_xinfa
        }
    
    def extract_recent_online_days(self, days: Dict) -> list:
        recent_days = []
        for day, seconds in days.items():
            recent_days.append({
                'day_id': day,
                'online_seconds': seconds,
                'online_hours': round(seconds / 3600, 2)
            })
        return recent_days
    
    def save_data(self, character_info: Dict):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nickname = character_info['base']['nickname']
        safe_nickname = "".join(c for c in nickname if c.isalnum() or c in ('_', '-'))
        filename = f"{SAVE_DIR}/character_{safe_nickname}_{timestamp}.json"
        
        with self.lock:
            self.captured_data.append(character_info)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(character_info, f, ensure_ascii=False, indent=2)
        
        summary_file = f"{SAVE_DIR}/latest_character.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(character_info, f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def format_timestamp(ts: float) -> str:
        if ts <= 0:
            return "Unknown"
        dt = datetime.fromtimestamp(ts)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    
    @staticmethod
    def format_duration(seconds: float) -> str:
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

addons = [YanYunInterceptor()]
