from mitmproxy import http, ctx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import threading
import time

TARGET_URL = "datamsapi.ds.163.com"
TARGET_PATH = "/v1/h72roletool/proxyGameRole"
SAVE_DIR = "captured_data"

class YanYunInterceptor:
    def __init__(self):
        self.captured_data = []
        self.lock = threading.Lock()
        os.makedirs(SAVE_DIR, exist_ok=True)
        
    def request(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            ctx.log.info(f"[*] Captured request to {flow.request.pretty_url}")
            
    def response(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            try:
                ctx.log.info(f"[+] Received response from {flow.request.pretty_url}")
                
                response_data = flow.response.content.decode('utf-8')
                data = json.loads(response_data)
                
                if data.get('success') and data.get('code') == 0:
                    character_info = self.parse_character_data(data.get('data', {}))
                    self.save_data(character_info)
                    
                    ctx.log.info(f"[✓] Successfully parsed character: {character_info.get('base', {}).get('nickname', 'Unknown')}")
                    
            except json.JSONDecodeError as e:
                ctx.log.error(f"[!] JSON decode error: {e}")
            except Exception as e:
                ctx.log.error(f"[!] Error processing response: {e}")
    
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
            'school': self.get_school_name(base.get('school', 0)),
            'create_time': self.format_timestamp(base.get('create_time', 0)),
            'login_time': self.format_timestamp(base.get('login_time', 0)),
            'logout_time': self.format_timestamp(base.get('logout_time', 0)),
            'online_time': self.format_duration(base.get('online_time', 0)),
            'max_xiuwei_kungfu': base.get('max_xiuwei_kungfu', 0),
            'recent_online_days': self.extract_recent_online_days(base.get('recent_online_day_time', {})),
            'hostnum': data.get('hostnum', 0)
        }
    
    def extract_combat_info(self, data: Dict) -> Dict:
        combat = data.get('combat_plan', {})
        return {
            'kongfu': {
                'main': self.get_kongfu_name(combat.get('kongfu', {}).get('kongfu_main', 0)),
                'main_level': combat.get('kongfu_level', {}).get('kongfu_main', {}).get('level', 0),
                'sub': self.get_kongfu_name(combat.get('kongfu', {}).get('kongfu_sub', 0)),
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
            equip = {
                'slot': slot,
                'no': equip_data.get('No', 0),
                'name': self.get_equip_name(equip_data.get('No', 0)),
                'durability': equip_data.get('durability', 0),
                'retoned': equip_data.get('retoned', 0),
                'suffix': equip_data.get('suffix', 0),
                'gain_ts': self.format_timestamp(equip_data.get('gain_ts', 0)),
                'safe_lock': equip_data.get('safe_lock', False),
                'base_attrs': equip_data.get('base_attrs', {}),
                'base_affixes': self.parse_affixes(equip_data.get('ex', {}).get('base_affixes', []))
            }
            equipments.append(equip)
        
        return equipments
    
    def parse_affixes(self, affixes: list) -> list:
        parsed = []
        for affix in affixes:
            if len(affix) >= 4:
                parsed.append({
                    'id': affix[0],
                    'value': affix[1],
                    'rate': round(affix[2] * 100, 2),
                    'quality': affix[3],
                    'is_max': affix[4] if len(affix) > 4 else False
                })
        return parsed
    
    def extract_club_info(self, data: Dict) -> Dict:
        club = data.get('club', {})
        return {
            'name': club.get('club_name', ''),
            'id': club.get('club_id', ''),
            'hostnum': club.get('hostnum', 0)
        }
    
    def extract_real_attrs(self, data: Dict) -> Dict:
        real_attr = data.get('real_attr', {})
        return {
            'STR': real_attr.get('STR', 0),
            'CON': real_attr.get('CON', 0),
            'AGI': real_attr.get('AGI', 0),
            'BAS': real_attr.get('BAS', 0),
            'XIUWEI_KUNGFU': real_attr.get('XIUWEI_KUNGFU', 0),
            'CRI': real_attr.get('CRI', 0)
        }
    
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
            parsed_xinfa[slot_id] = {
                'name': self.get_xinfa_name(int(slot_id)),
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
        filename = f"{SAVE_DIR}/character_{nickname}_{timestamp}.json"
        
        with self.lock:
            self.captured_data.append(character_info)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(character_info, f, ensure_ascii=False, indent=2)
        
        summary_file = f"{SAVE_DIR}/latest_character.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(character_info, f, ensure_ascii=False, indent=2)
    
    @staticmethod
    def get_school_name(school_id: int) -> str:
        schools = {
            1: "君子",
            2: "武士",
            3: "刺客",
            4: "侠客",
            5: "医生",
            6: "琵琶",
            7: "钜子",
            8: "天曜",
            9: "青牙",
            10: "何不留",
            11: "毒奶",
            12: "醉拳",
            13: "明灭",
            14: "千恩",
            15: "云寒",
            16: "武学"
        }
        return schools.get(school_id, f"Unknown({school_id})")
    
    @staticmethod
    def get_kongfu_name(kongfu_id: int) -> str:
        kongfu_map = {
            20603: "天地无极",
            20702: "九宫飞星",
        }
        return kongfu_map.get(kongfu_id, f"技能ID:{kongfu_id}")
    
    @staticmethod
    def get_equip_name(equip_no: int) -> str:
        if 1101800 <= equip_no <= 1101899:
            return "武器"
        elif 1101700 <= equip_no <= 1101799:
            return "护腕"
        elif 1101600 <= equip_no <= 1101699:
            return "护肩"
        elif 1101500 <= equip_no <= 1101599:
            return "腰带"
        elif 1101400 <= equip_no <= 1101499:
            return "护腿"
        elif 1101300 <= equip_no <= 1101399:
            return "护胸"
        elif 1101200 <= equip_no <= 1101299:
            return "头盔"
        elif 1101100 <= equip_no <= 1101199:
            return "项链"
        elif 1101000 <= equip_no <= 1101099:
            return "戒指1"
        elif 1100900 <= equip_no <= 1100999:
            return "戒指2"
        elif 1100800 <= equip_no <= 1100899:
            return "披风"
        elif 1100700 <= equip_no <= 1100799:
            return "护心"
        elif 1100600 <= equip_no <= 1100699:
            return "护腕(副)"
        elif 1100500 <= equip_no <= 1100599:
            return "腰带(副)"
        elif 1100400 <= equip_no <= 1100499:
            return "护腿(副)"
        elif 1100300 <= equip_no <= 1100399:
            return "护胸(副)"
        elif 1100200 <= equip_no <= 1100299:
            return "头盔(副)"
        elif 1100100 <= equip_no <= 1100199:
            return "项链(副)"
        elif 1100000 <= equip_no <= 1100099:
            return "戒指(副)"
        elif 1101900 <= equip_no <= 1101999:
            return "副手"
        elif 2402000 <= equip_no <= 2402099:
            return "时装"
        return f"装备{equip_no}"
    
    @staticmethod
    def get_xinfa_name(xinfa_id: int) -> str:
        xinfas = {
            501: "心法1",
            502: "心法2",
            504: "心法4",
            81: "心法81"
        }
        return xinfas.get(xinfa_id, f"心法{xinfa_id}")
    
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
