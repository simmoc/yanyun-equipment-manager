# 燕云角色信息收集工具 - 完整使用指南

## 📦 工具概述

这是一个用于燕云游戏的网络流量监控工具，可以自动捕获并解析角色信息，提供可读化的数据输出。

## 🚀 快速开始

### 1. 安装依赖
```bash
pip install -r network_monitor_requirements.txt
```

### 2. 启动监控（推荐使用增强版）
```bash
mitmweb -s network_monitor_v2.py
```

### 3. 配置浏览器代理
- 地址：`127.0.0.1`
- 端口：`8080`

### 4. 查看角色信息
- 在游戏中查看角色信息
- 程序自动捕获并保存数据
- 查看 `captured_data/latest_character.json`

## 📁 文件说明

### 核心文件
- **network_monitor_v2.py** - 增强版监控脚本（推荐）
- **network_monitor.py** - 基础版监控脚本
- **config_downloader.py** - 配置文件下载工具

### 配置文件
- **config_data/** - 游戏配置文件目录
  - `suffix_data.json` - 套装配置
  - `school_data.json` - 门派配置
  - `equip_data.json` - 装备配置

### 数据输出
- **captured_data/** - 角色数据目录
  - `latest_character.json` - 最新角色数据
  - `character_xxx_timestamp.json` - 历史记录

### 文档
- `network_monitor_README.md` - 基础使用说明
- `network_monitor_CONFIG_README.md` - 配置文件详细说明
- `network_monitor_QUICKSTART.md` - 快速开始指南

## 🎯 核心功能

### 1. 网络流量监控
- 监听目标API响应
- 自动识别角色信息请求
- 支持实时解析

### 2. 配置文件集成
自动下载并使用游戏配置数据：
- ✅ 套装名称可读化
- ✅ 门派名称可读化
- ✅ 装备名称可读化
- ✅ 词缀属性中文名称
- ✅ 功法/心法名称映射

### 3. 数据解析
自动解析以下信息：
- 角色基础信息（名称、等级、门派、在线时长）
- 战斗配置（功法、心法、技能）
- 装备详情（装备、词缀、评分）
- 帮派信息
- 属性数据
- 成就统计

### 4. 数据保存
- JSON格式保存
- 自动命名（角色名+时间戳）
- 保留最新数据副本

## 📊 可读化示例

### 门派信息
```json
// 原始: school: 12
// 可读化: school: "醉拳"
```

### 装备信息
```json
{
  "slot": "1",
  "no": 1101877,
  "name": "武器",           // 可读化
  "suffix": "套装名称",     // 可读化
  "suffix_id": 34,
  "base_affixes": [
    {
      "id": 10613002,
      "name": "外功攻击",   // 可读化
      "value": 103.2,
      "rate": 97.7,
      "quality": "紫色",    // 可读化
      "is_max": true
    }
  ]
}
```

### 基础属性
```json
// 原始
{
  "MAX_W_ATK": 203,
  "MIN_W_ATK": 87
}

// 可读化
{
  "外功攻击上限": 203,
  "外功攻击下限": 87
}
```

## 🔧 使用方式

### 方式1: 使用启动器（最简单）
```bash
# Windows
network_monitor_launcher.bat

# 跨平台
python network_monitor_launcher.py
```

### 方式2: 直接运行监控脚本
```bash
# 增强版（推荐）
mitmweb -s network_monitor_v2.py

# 基础版
mitmweb -s network_monitor.py
```

### 方式3: 后台运行
```bash
mitmdump -s network_monitor_v2.py
```

### 方式4: 手动下载配置文件
```bash
python config_downloader.py
python config_downloader.py --download  # 强制重新下载
python config_downloader.py --check     # 检查本地配置
```

## 🎮 代理配置

### Chrome/Edge
1. 安装 SwitchyOmega 扩展
2. 新建代理规则
3. 配置：`127.0.0.1:8080`
4. 启用代理

### Firefox
1. 选项 → 网络设置 → 手动代理配置
2. 配置：`127.0.0.1:8080`
3. 对所有协议使用相同代理

### 安装证书
1. 访问 `http://mitm.it`
2. 下载对应浏览器证书
3. 导入为信任根证书
4. 重新访问HTTPS网站验证

## 📖 数据字段说明

### base - 基础信息
| 字段 | 说明 | 示例 |
|------|------|------|
| nickname | 角色名 | 再梦江南 |
| level | 等级 | 100 |
| school | 门派 | 醉拳 |
| school_id | 门派ID | 12 |
| online_time | 在线时长(可读) | 908小时30分钟 |
| online_seconds | 在线时长(秒) | 3270591 |

### combat_plan - 战斗配置
| 字段 | 说明 |
|------|------|
| kongfu.main | 主功法名称 |
| kongfu.main_level | 主功法等级 |
| kongfu.sub | 副功法名称 |
| kongfu.sub_level | 副功法等级 |
| xinfa | 心法配置 |
| battle_qs | 战斗技能 |
| battle_qs_level | 战斗技能等级 |

### equipment - 装备信息
| 字段 | 说明 |
|------|------|
| slot | 装备槽位 |
| name | 装备名称(可读) |
| suffix | 套装名称(可读) |
| durability | 耐久度 |
| base_affixes | 词缀属性 |
| retoned | 重铸次数 |

### 词缀属性
| 字段 | 说明 |
|------|------|
| id | 词缀ID |
| name | 词缀名称(可读) |
| value | 属性值 |
| rate | 评分率(%) |
| quality | 品质(可读) |
| is_max | 是否为最大值 |

### club - 帮派信息
| 字段 | 说明 |
|------|------|
| name | 帮派名称 |
| id | 帮派ID |
| hostnum | 帮派人气 |

### real_attr - 真实属性
| 字段 | 说明 |
|------|------|
| STR/力量 | 力量属性 |
| CON/体质 | 体质属性 |
| AGI/敏捷 | 敏捷属性 |

## ❓ 常见问题

### Q: 启动报错 "mitmproxy: command not found"
A: 确保已安装 mitmproxy：`pip install mitmproxy`

### Q: 无法捕获HTTPS流量
A: 
1. 安装mitmproxy证书到系统信任根证书
2. 重启浏览器
3. 清除浏览器缓存

### Q: 配置文件下载失败
A:
1. 检查网络连接
2. 手动访问配置文件URL
3. 使用 `--download` 参数重试

### Q: 端口被占用
A: 修改监控端口：
```bash
mitmweb -p 8081 -s network_monitor_v2.py
```

### Q: 如何更新配置文件
A:
```bash
rm -rf config_data/
python config_downloader.py
```

### Q: 捕获不到数据
A:
1. 确认代理配置正确
2. 确认游戏已登录
3. 查看角色信息页面触发API请求

## 🔒 注意事项

1. **隐私保护**: 妥善保管捕获的数据
2. **合规使用**: 仅用于个人游戏数据分析
3. **游戏协议**: 请遵守游戏用户协议
4. **数据备份**: 定期备份重要数据
5. **清理空间**: 定期清理历史数据

## 📈 性能优化

### 减少内存占用
- 定期清理 `captured_data/` 目录
- 使用后台模式运行

### 提高捕获效率
- 只监控特定域名
- 关闭不必要的浏览器标签页

## 🛠️ 故障排除

### 日志查看
启动时会显示详细日志：
```
[*] 捕获请求: https://datamsapi.ds.163.com/...
[+] 收到响应: https://datamsapi.ds.163.com/...
[✓] 成功解析角色: 再梦江南
```

### 调试模式
增加详细日志输出：
```python
# 在监控脚本中添加
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 扩展功能

### 添加新的词缀映射
编辑 `network_monitor_v2.py` 中的 `ConfigManager.init_affix_names()` 方法。

### 自定义数据保存
修改 `save_data()` 方法来自定义保存逻辑。

### 添加新的解析规则
在 `parse_character_data()` 方法中添加新的解析逻辑。

## 🔄 版本历史

### v2.0 (最新)
- ✅ 新增配置文件自动下载
- ✅ 支持数据可读化
- ✅ 新增词缀/功法/心法名称映射
- ✅ 优化数据结构输出

### v1.0
- ✅ 基础网络流量监控
- ✅ 角色信息解析
- ✅ 数据保存功能

## 📞 支持

如遇到问题，请检查：
1. Python环境是否正确安装
2. mitmproxy是否正确安装
3. 代理配置是否正确
4. 证书是否正确安装

## 🙏 致谢

- 使用 mitmproxy 进行网络流量监控
- 基于燕云游戏API数据分析

---

**版本**: 2.0  
**更新日期**: 2024-01  
**适用游戏**: 燕云十六声
