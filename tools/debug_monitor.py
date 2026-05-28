from mitmproxy import http, ctx
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

TARGET_URL = "datamsapi.ds.163.com"
TARGET_PATH = "/v1/h72roletool/proxyGameRole"
SAVE_DIR = "debug_data"

class YanYunDebugger:
    def __init__(self):
        os.makedirs(SAVE_DIR, exist_ok=True)
        
    def request(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            ctx.log.info(f"[*] 捕获请求: {flow.request.pretty_url}")
            
    def response(self, flow: http.HTTPFlow):
        if TARGET_URL in flow.request.pretty_host and TARGET_PATH in flow.request.path:
            try:
                ctx.log.info(f"[+] 收到响应: {flow.request.pretty_url}")
                
                response_data = flow.response.content.decode('utf-8')
                data = json.loads(response_data)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{SAVE_DIR}/raw_data_{timestamp}.json"
                
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                ctx.log.info(f"[✓] 原始数据已保存到: {filename}")
                
                # 打印数据结构
                ctx.log.info(f"[DEBUG] 数据结构分析:")
                ctx.log.info(f"  - success: {data.get('success')}")
                ctx.log.info(f"  - code: {data.get('code')}")
                
                if 'data' in data:
                    data_dict = data['data']
                    ctx.log.info(f"  - data keys: {list(data_dict.keys())}")
                    
                    if 'base' in data_dict:
                        base = data_dict['base']
                        ctx.log.info(f"    - base keys: {list(base.keys())}")
                        ctx.log.info(f"    - school: {base.get('school')}")
                        ctx.log.info(f"    - nickname: {base.get('nickname')}")
                    
                    if 'combat_plan' in data_dict:
                        combat = data_dict['combat_plan']
                        ctx.log.info(f"    - combat_plan keys: {list(combat.keys())}")
                        if 'wear_equips' in combat:
                            ctx.log.info(f"    - wear_equips count: {len(combat['wear_equips'])}")
                            if combat['wear_equips']:
                                first_equip = list(combat['wear_equips'].items())[0]
                                ctx.log.info(f"      - 第一个装备: {first_equip[0]} - {list(first_equip[1].keys())}")
                    
            except json.JSONDecodeError as e:
                ctx.log.error(f"[!] JSON解析错误: {e}")
            except Exception as e:
                ctx.log.error(f"[!] 处理响应时出错: {e}")

addons = [YanYunDebugger()]
