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
                
                # 保存原始响应
                raw_data = flow.response.content.decode('utf-8')
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                raw_filename = f"{SAVE_DIR}/raw_response_{timestamp}.json"
                
                with open(raw_filename, 'w', encoding='utf-8') as f:
                    f.write(raw_data)
                
                ctx.log.info(f"[✓] 原始响应已保存到: {raw_filename}")
                
                # 解析并打印结构
                data = json.loads(raw_data)
                ctx.log.info(f"[DEBUG] 顶级键: {list(data.keys())}")
                
                if 'data' in data:
                    data_dict = data['data']
                    ctx.log.info(f"[DEBUG] data 键: {list(data_dict.keys())}")
                    
                    if 'base' in data_dict:
                        base = data_dict['base']
                        ctx.log.info(f"[DEBUG] base 内容: {json.dumps(base, ensure_ascii=False)}")
                    
                    if 'combat_plan' in data_dict:
                        combat = data_dict['combat_plan']
                        ctx.log.info(f"[DEBUG] combat_plan 键: {list(combat.keys())}")
                        if 'wear_equips' in combat:
                            ctx.log.info(f"[DEBUG] wear_equips 数量: {len(combat['wear_equips'])}")
                
            except json.JSONDecodeError as e:
                ctx.log.error(f"[!] JSON解析错误: {e}")
            except Exception as e:
                ctx.log.error(f"[!] 处理响应时出错: {e}")

addons = [YanYunDebugger()]
