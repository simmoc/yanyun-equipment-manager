# 燕云角色信息收集工具 - 快速参考

## 🚀 一分钟启动

```bash
# 1. 安装依赖
pip install -r network_monitor_requirements.txt

# 2. ⭐ 安装证书（重要！）
python cert_installer.py
# 或使用启动器: python network_monitor_launcher.py

# 3. 启动监控（推荐）
mitmweb -s network_monitor_v2.py

# 4. 配置浏览器代理 127.0.0.1:8080

# 5. 在游戏中查看角色信息

# 6. 查看数据
type captured_data\latest_character.json
```

## 📋 命令速查

### 证书安装（⭐ 重要！）
```bash
python cert_installer.py                # 自动安装证书
# Windows: 以管理员身份运行
# macOS/Linux: 使用 sudo
```

### 启动监控
```bash
mitmweb -s network_monitor_v2.py        # 可视化界面
mitmdump -s network_monitor_v2.py       # 后台运行
python network_monitor_launcher.py      # 启动器
network_monitor_launcher.bat            # Windows快捷启动
```

### 配置文件管理
```bash
python config_downloader.py             # 下载配置
python config_downloader.py --download  # 强制重新下载
python config_downloader.py --check     # 检查配置
```

### 测试工具
```bash
python test_tool.py                     # 完整测试
```

## 🎯 核心功能

| 功能 | 说明 |
|------|------|
| ⭐ 自动证书安装 | Windows/macOS/Linux 全平台支持 |
| 门派名称 | 12 → 醉拳 |
| 装备名称 | 1101877 → 武器 |
| 套装名称 | 34 → 套装名称 |
| 词缀名称 | 10613002 → 外功攻击 |
| 功法名称 | 20603 → 天地无极 |
| 心法名称 | 501 → 内功心法 |

## 📁 文件位置

| 文件/目录 | 说明 |
|----------|------|
| `cert_installer.py` | ⭐ 证书自动安装工具 |
| `network_monitor_v2.py` | 增强版监控脚本 |
| `config_data/` | 配置文件目录 |
| `captured_data/` | 角色数据目录 |
| `latest_character.json` | 最新数据 |
| `CERT_INSTALL_GUIDE.md` | 证书安装详细指南 |

## 🔧 代理配置

```
地址: 127.0.0.1
端口: 8080
类型: HTTP代理
```

## 📊 数据结构速查

### 基础信息
```json
{
  "nickname": "角色名",
  "level": 100,
  "school": "门派",
  "online_time": "在线时长"
}
```

### 装备格式
```json
{
  "slot": "槽位",
  "name": "装备名",
  "suffix": "套装",
  "base_affixes": [
    {
      "name": "外功攻击",
      "value": 103.2,
      "rate": 97.7,
      "quality": "紫色"
    }
  ]
}
```

## ❓ 常见问题

| 问题 | 解决方案 |
|------|---------|
| 启动报错 | `pip install mitmproxy` |
| 无法捕获 | 先运行 `python cert_installer.py` |
| 证书警告 | 重启浏览器，清除缓存 |
| 端口被占 | `mitmweb -p 8081 ...` |
| 配置失败 | 删除`config_data/`后重试 |

### 证书相关问题

| 问题 | 解决方案 |
|------|---------|
| 找不到证书 | 先运行一次 `mitmdump` 生成证书 |
| 需要权限 | Windows: 以管理员身份运行<br>macOS/Linux: 使用 `sudo` |
| Firefox有警告 | Firefox需要单独配置（见 CERT_INSTALL_GUIDE.md） |


## 🎮 捕获流程

```
1. 安装证书 ⭐
   ↓
   python cert_installer.py
   ↓
2. 启动 mitmweb
   ↓
3. 配置浏览器代理
   ↓
4. 登录游戏
   ↓
5. 查看角色信息
   ↓
6. 程序自动捕获 ✓
   ↓
7. 查看 captured_data/
```

> 💡 提示：证书只需安装一次！

## 📝 常用配置URL

- 套装配置: `https://s.166.net/config/ds_h72/suffix_data.json`
- 门派配置: `https://s.166.net/config/ds_h72/school_data.json`
- 装备配置: `https://s.166.net/config/ds_h72/equip_data.json`

## 🔑 关键ID映射

### 门派
| ID | 名称 |
|----|------|
| 12 | 醉拳 |
| 8 | 天曜 |
| 7 | 钜子 |
| 1 | 君子 |

### 功法
| ID | 名称 |
|----|------|
| 20603 | 天地无极 |
| 20702 | 九宫飞星 |

### 装备类型
| 编号范围 | 类型 |
|---------|------|
| 1101800-1101899 | 武器 |
| 1101300-1101399 | 护胸 |
| 1101200-1101299 | 头盔 |

### 词缀
| ID | 名称 |
|----|------|
| 10613002 | 外功攻击 |
| 10693002 | 内功攻击 |
| 10693119 | 生命值 |
| 10693012 | 会心几率 |
| 10693021 | 会心伤害 |

### 品质等级
| 等级 | 颜色 |
|------|------|
| 1 | 绿色 |
| 2 | 蓝色 |
| 3 | 紫色 |
| 4 | 橙色 |
| 5 | 粉色 |

## 💡 使用技巧

1. **快速查看**: `type captured_data\latest_character.json`
2. **历史数据**: `dir captured_data\`
3. **强制更新配置**: `python config_downloader.py --download`
4. **更改端口**: `mitmweb -p 8081 -s network_monitor_v2.py`

## 📞 故障排查

```bash
# 检查Python
python --version

# 检查mitmproxy
mitmproxy --version

# 检查配置文件
dir config_data\

# 检查数据目录
dir captured_data\

# 查看最新数据
type captured_data\latest_character.json
```

## 🎯 快捷命令

```bash
# 一键启动（Windows）
network_monitor_launcher.bat

# 查看帮助
python config_downloader.py --help
```

---

**提示**: 首次使用建议先阅读 `network_monitor_COMPLETE_GUIDE.md`
