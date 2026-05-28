#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def test_parse_sample_data():
    sample_data = {
        "code": 0,
        "data": {
            "_account_": "test@example.com",
            "base": {
                "nickname": "测试角色",
                "number_id": "1234567890",
                "level": 100,
                "school": 12,
                "create_time": 1770971041.939806,
                "login_time": 1779779982.891739,
                "online_time": 3270591.2375764847,
                "max_xiuwei_kungfu": 44877
            },
            "combat_plan": {
                "kongfu": {
                    "kongfu_main": 20603,
                    "kongfu_sub": 20702
                },
                "kongfu_level": {
                    "kongfu_main": {"level": 100},
                    "kongfu_sub": {"level": 100}
                },
                "wear_equips": {
                    "1": {
                        "ID": "test123",
                        "No": 1101877,
                        "ex": {
                            "base_affixes": [
                                [10613002, 103.2, 0.977, 3, True],
                                [10693002, 64.8, 0.970, 3, True]
                            ],
                            "base_attrs": {
                                "MAX_W_ATK": 203,
                                "MIN_W_ATK": 87
                            }
                        },
                        "durability": 52,
                        "suffix": 34,
                        "gain_ts": 1774820009
                    }
                },
                "xinfa": {
                    "active_slots": [],
                    "passive_slots": [501, 81, 502, 504],
                    "xinfa_info": {
                        "501": {"rank": 6},
                        "502": {"rank": 6},
                        "504": {"rank": 6},
                        "81": {"rank": 6}
                    }
                }
            },
            "club": {
                "club_name": "测试帮派",
                "club_id": "test123",
                "hostnum": 10048
            },
            "real_attr": {
                "STR": 607.6,
                "CON": 242,
                "AGI": 242,
                "BAS": 242,
                "CRI": 436.392,
                "XIUWEI_KUNGFU": 44580
            },
            "achievement.quantity": {
                "1": 286,
                "2": 149,
                "3": 41
            }
        },
        "success": True
    }
    
    print("=" * 60)
    print("测试数据解析")
    print("=" * 60)
    
    if sample_data.get('success') and sample_data.get('code') == 0:
        print("✓ 成功验证示例数据结构")
    else:
        print("✗ 示例数据验证失败")
        return False
    
    data = sample_data['data']
    
    print(f"\n角色信息:")
    print(f"  昵称: {data['base']['nickname']}")
    print(f"  等级: {data['base']['level']}")
    print(f"  门派ID: {data['base']['school']}")
    print(f"  账号: {data['_account_']}")
    
    print(f"\n战斗配置:")
    print(f"  主功法: {data['combat_plan']['kongfu']['kongfu_main']}")
    print(f"  副功法: {data['combat_plan']['kongfu']['kongfu_sub']}")
    
    print(f"\n装备信息:")
    for slot, equip in data['combat_plan']['wear_equips'].items():
        print(f"  槽位{slot}: 装备ID={equip['No']}")
        if 'base_affixes' in equip.get('ex', {}):
            print(f"    词缀数量: {len(equip['ex']['base_affixes'])}")
    
    print(f"\n属性信息:")
    print(f"  力量: {data['real_attr']['STR']}")
    print(f"  体质: {data['real_attr']['CON']}")
    print(f"  敏捷: {data['real_attr']['AGI']}")
    
    print(f"\n成就统计:")
    print(f"  金: {data['achievement.quantity']['1']}")
    print(f"  银: {data['achievement.quantity']['2']}")
    print(f"  铜: {data['achievement.quantity']['3']}")
    
    return True

def test_config_loading():
    print("\n" + "=" * 60)
    print("测试配置文件加载")
    print("=" * 60)
    
    try:
        from config_downloader import ConfigDownloader
        
        downloader = ConfigDownloader()
        configs = downloader.load_all_local()
        
        loaded_count = sum(1 for v in configs.values() if v)
        
        if loaded_count > 0:
            print(f"✓ 成功加载 {loaded_count}/3 个配置文件")
            for name, data in configs.items():
                if data:
                    print(f"  - {name}: {len(data)} 条")
            return True
        else:
            print("⚠ 未找到本地配置文件")
            print("  运行 'python config_downloader.py' 下载配置")
            return False
            
    except ImportError as e:
        print(f"✗ 无法导入配置下载器: {e}")
        return False
    except Exception as e:
        print(f"✗ 配置加载出错: {e}")
        return False

def test_name_mapping():
    print("\n" + "=" * 60)
    print("测试名称映射功能")
    print("=" * 60)
    
    test_cases = [
        ("school", 12, "醉拳"),
        ("school", 8, "天曜"),
        ("school", 1, "君子"),
        ("kongfu", 20603, "天地无极"),
        ("kongfu", 20702, "九宫飞星"),
        ("xinfa", 501, "内功心法"),
        ("equip", 1101877, "武器"),
        ("equip", 1101300, "护胸"),
        ("equip", 2402000, "时装"),
    ]
    
    try:
        from config_downloader import ConfigParser
        
        parser = ConfigParser()
        
        success_count = 0
        for type_name, id_value, expected_name in test_cases:
            if type_name == "school":
                result = parser.get_school_name(id_value)
            elif type_name == "kongfu":
                result = parser.get_kongfu_name(id_value)
            elif type_name == "xinfa":
                result = parser.get_xinfa_name(id_value)
            elif type_name == "equip":
                result = parser.get_equip_name(id_value)
            
            status = "✓" if expected_name in result else "○"
            if expected_name in result:
                success_count += 1
            print(f"  {status} {type_name}[{id_value}] → {result} (期望: {expected_name})")
        
        print(f"\n映射测试完成: {success_count}/{len(test_cases)} 通过")
        return success_count > 0
        
    except ImportError as e:
        print(f"⚠ 无法导入配置解析器: {e}")
        print("  将使用默认映射")
        return False
    except Exception as e:
        print(f"✗ 映射测试出错: {e}")
        return False

def test_file_structure():
    print("\n" + "=" * 60)
    print("检查文件结构")
    print("=" * 60)
    
    required_files = [
        "network_monitor.py",
        "network_monitor_v2.py",
        "config_downloader.py",
        "network_monitor_requirements.txt",
    ]
    
    all_exist = True
    for filename in required_files:
        if Path(filename).exists():
            size = Path(filename).stat().st_size
            print(f"  ✓ {filename} ({size} bytes)")
        else:
            print(f"  ✗ {filename} (不存在)")
            all_exist = False
    
    directories = ["config_data", "captured_data"]
    for dirname in directories:
        if Path(dirname).exists():
            print(f"  ✓ {dirname}/ (目录存在)")
        else:
            print(f"  ○ {dirname}/ (目录不存在，将自动创建)")
    
    return all_exist

def main():
    print("\n" + "=" * 60)
    print("  燕云角色信息收集工具 - 测试套件")
    print("=" * 60)
    
    results = {
        "文件结构": test_file_structure(),
        "数据解析": test_parse_sample_data(),
        "配置加载": test_config_loading(),
        "名称映射": test_name_mapping(),
    }
    
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✓ 通过" if result else "○ 未完全通过"
        print(f"  {test_name}: {status}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n通过: {passed}/{total}")
    
    if passed >= 2:
        print("\n✓ 工具已准备就绪，可以开始使用！")
        print("\n启动命令:")
        print("  mitmweb -s network_monitor_v2.py")
    else:
        print("\n⚠ 部分测试未通过，请检查依赖安装")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
