# 燕云角色信息收集工具 - 更新日志 v2.2

---

## 🎉 版本 2.2 更新说明

### ✨ 新增功能

#### 1. 系统代理自动管理
**新增文件:**
- `proxy_manager.py` - 跨平台系统代理管理器

**功能特点:**
- ✅ 自动保存当前代理设置
- ✅ Windows (注册表)
- ✅ macOS (networksetup)
- ✅ Linux (GNOME gsettings)
- ✅ 程序退出时自动恢复代理
- ✅ 支持自定义代理地址和端口

**新增配置文件:**
- `~/.yanyun_proxy_config.json` - 代理配置保存

#### 2. 启动器集成代理管理
**更新文件:**
- `network_monitor_launcher.py` - 集成代理管理功能

**新增菜单选项:**
- 选项 1: mitmweb + 自动设置系统代理 (推荐)
- 选项 8: 设置系统代理 (127.0.0.1:8080
- 选项 9: 恢复系统代理

**功能特点:**
- 启动mitmweb时自动设置系统代理
- 停止时自动恢复
- 支持单独设置/恢复代理
- 无需手动配置浏览器代理

### 📦 代理管理器 API

```python
from proxy_manager import ProxyManager

# 创建代理管理器
manager = ProxyManager(host='127.0.0.1', port=8080)

# 设置代理
manager.set_proxy()

# 恢复代理
manager.restore_proxy()
```

### 🚀 使用方式变化

#### 新的快速开始（自动代理）
```batch
1. 双击 cert_installer.exe（自动提权）
2. 双击 network_monitor_launcher.bat
3. 选择选项 1（mitmweb + 自动设置系统代理
4. 开始使用！（无需手动配置浏览器代理）
```

#### 单独设置代理
```batch
# 设置代理
python proxy_manager.py

# 或通过启动器
python network_monitor_launcher.py
# 选择选项 8
```

### ✅ 兼容性

- 完全兼容 v2.1、v2.0 和 v1.0
- 代理管理是可选功能
- 所有现有功能保持不变

---

## 🎉 版本 2.1 更新说明

### ✨ 新增功能

#### 1. 自动证书安装工具
**新增文件:**
- `cert_installer.py` - 跨平台证书自动安装工具

**功能特点:**
- ✅ 自动生成证书（首次运行）
- ✅ Windows 系统自动申请管理员权限
- ✅ Linux/macOS 自动使用 sudo 提权
- ✅ 支持自动安装和手动安装两种模式
- ✅ 跨平台支持（Windows/macOS/Linux）

**新增文档:**
- `CERT_INSTALL_GUIDE.md` - 证书安装详细指南

#### 2. 可执行程序打包支持
**新增文件:**
- `build.py` - 跨平台 Python 打包脚本
- `build.bat` - Windows 批处理打包助手
- `cert_installer.spec` - 证书工具打包配置
- `network_monitor.spec` - 网络监控工具打包配置

**功能特点:**
- ✅ 一键打包成单个可执行文件
- ✅ 自动处理依赖
- ✅ 友好的交互式菜单
- ✅ 支持单独或全部打包
- ✅ 自动清理临时文件

**新增文档:**
- `BUILD_GUIDE.md` - 打包和部署完整指南

#### 3. 自动管理员权限获取
**增强功能:**
- Windows 系统自动使用 `ShellExecuteW` 提权
- Linux/macOS 自动使用 `sudo` 重新启动
- 无需用户手动操作
- 友好的用户提示

#### 4. 启动器升级
**更新文件:**
- `network_monitor_launcher.py` - 新增可执行文件检测
- `network_monitor_launcher.bat` - 新增可执行文件支持

**新增菜单选项:**
- 选项 7: 安装证书 (Python版)
- 选项 8: 证书安装工具 (EXE版)

**功能特点:**
- 自动检测可执行文件是否存在
- 优先使用 EXE 版本（如果存在）
- 支持混合使用脚本和可执行文件

### 📦 打包相关文件

#### 新增工具
- `build.py` - Python 打包脚本（推荐）
- `build.bat` - Windows 批处理脚本
- `cert_installer.spec` - PyInstaller 配置
- `network_monitor.spec` - PyInstaller 配置

#### 打包输出目录
```
release/
├── cert_installer.exe    (证书安装工具)
└── network_monitor.exe   (网络监控工具)
```

### 📚 文档更新

- `network_monitor_GETTING_STARTED.md` - 添加打包说明和 EXE 使用说明
- `BUILD_GUIDE.md` - 全新的打包和部署指南
- `CERT_INSTALL_GUIDE.md` - 全新的证书安装指南
- `network_monitor_CHANGELOG.md` - 更新日志（本文档）

### 🔧 技术改进

#### 1. 权限管理
```python
def elevate_privileges():
    if system == "Windows":
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, script, None, 1)
    elif system == "Darwin" or system == "Linux":
        os.execvp("sudo", ["sudo"] + args)
```

#### 2. 自动证书生成
```python
def generate_certificates():
    # 自动启动 mitmdump 生成证书
    subprocess.Popen([mitmdump_path, "-q", "--set", "connection_strategy=lazy"], ...)
```

### 🚀 使用方式变化

#### 新的快速开始（EXE 版本）
```batch
1. 双击 cert_installer.exe（自动提权）
2. 双击 network_monitor_launcher.bat
3. 开始使用！
```

#### 打包命令
```bash
# 使用 Python 脚本
python build.py

# Windows 用户
build.bat
```

### ✅ 兼容性

- 完全兼容 v2.0 和 v1.0
- 支持混合使用脚本和可执行文件
- 所有现有功能保持不变

---

## 🎉 版本 2.0 更新说明

### ✨ 新增功能

#### 1. 配置文件自动下载和集成
**新增文件:**
- `config_downloader.py` - 配置文件下载和管理工具
- `config_data/` - 配置文件保存目录

**配置文件:**
- `suffix_data.json` - 套装基础信息
- `school_data.json` - 门派基础信息
- `equip_data.json` - 装备基础信息

**功能特点:**
- ✅ 自动从官方服务器下载最新配置
- ✅ 本地缓存配置，无需重复下载
- ✅ 自动更新机制
- ✅ 支持强制重新下载

#### 2. 数据可读化
**增强的监控脚本:**
- `network_monitor_v2.py` - 集成配置文件功能的增强版

**可读化内容:**
- ✅ 门派名称: `12` → `"醉拳"`
- ✅ 装备名称: `1101877` → `"武器"`
- ✅ 套装名称: `34` → `"套装名称"`
- ✅ 词缀名称: `10613002` → `"外功攻击"`
- ✅ 功法名称: `20603` → `"天地无极"`
- ✅ 心法名称: `501` → `"内功心法"`

#### 3. 词缀属性可读化
**新增词缀映射:**
```python
10613002 → "外功攻击"
10693002 → "内功攻击"
10693021 → "会心伤害"
10693012 → "会心几率"
10693119 → "生命值"
10643004 → "防御"
10673002 → "弓箭伤害"
10683003 → "穿刺"
10684002 → "弓箭攻击"
10672002 → "弓箭增伤"
# ... 更多词缀
```

#### 4. 功法与心法映射
**功法映射:**
```python
20603 → "天地无极"
20702 → "九宫飞星"
20501 → "不动如山"
20502 → "疾风步"
20601 → "万剑归宗"
20701 → "天罗地网"
```

**心法映射:**
```python
501 → "内功心法"
502 → "外功心法"
504 → "身法心法"
81 → "基础心法"
```

#### 5. 装备品质等级
```python
1 → "绿色"
2 → "蓝色"
3 → "紫色"
4 → "橙色"
5 → "粉色"
```

### 📊 数据结构优化

#### 装备数据结构改进

**Before (v1.0):**
```json
{
  "No": 1101877,
  "durability": 52,
  "base_attrs": {
    "MAX_W_ATK": 203,
    "MIN_W_ATK": 87
  }
}
```

**After (v2.0):**
```json
{
  "no": 1101877,
  "name": "武器",
  "suffix": "套装名称",
  "suffix_id": 34,
  "durability": 52,
  "base_attrs": {
    "外功攻击上限": 203,
    "外功攻击下限": 87
  },
  "base_affixes": [
    {
      "id": 10613002,
      "name": "外功攻击",
      "value": 103.2,
      "rate": 97.7,
      "quality": "紫色",
      "is_max": true
    }
  ]
}
```

#### 基础属性优化

**Before:**
```json
{
  "STR": 607.6,
  "CON": 242,
  "AGI": 242
}
```

**After:**
```json
{
  "力量": 607.6,
  "体质": 242,
  "敏捷": 242,
  "基础": 242,
  "修为功夫": 44580,
  "会心": 436.392
}
```

### 📁 文件清单

#### 核心脚本
- `network_monitor_v2.py` - **增强版监控脚本（推荐使用）**
- `network_monitor.py` - 基础版监控脚本
- `config_downloader.py` - 配置文件下载工具
- `test_tool.py` - 测试工具
- `config_analyzer.py` - 配置文件分析工具

#### 文档
- `network_monitor_COMPLETE_GUIDE.md` - **完整使用指南**
- `network_monitor_CONFIG_README.md` - 配置文件详细说明
- `network_monitor_QUICKREF.md` - 快速参考卡片
- `network_monitor_README.md` - 基础使用说明（已更新）
- `network_monitor_QUICKSTART.md` - 快速开始（已更新）

#### 辅助工具
- `network_monitor_launcher.py` - Python启动器
- `network_monitor_launcher.bat` - Windows批处理启动器

#### 配置文件
- `network_monitor_requirements.txt` - Python依赖清单

### 🔄 使用方式变化

#### 启动命令
```bash
# v1.0
mitmweb -s network_monitor.py

# v2.0 (推荐)
mitmweb -s network_monitor_v2.py
```

#### 配置文件管理
```bash
# 下载配置
python config_downloader.py

# 强制重新下载
python config_downloader.py --download

# 检查配置
python config_downloader.py --check
```

### 📖 数据输出示例

```json
{
  "capture_time": "2024-01-01T12:00:00",
  "base": {
    "account": "test@example.com",
    "nickname": "再梦江南",
    "number_id": "0268070082",
    "level": 100,
    "school": "醉拳",
    "school_id": 12,
    "online_time": "908小时30分钟15秒",
    "online_seconds": 3270591.24,
    "create_time": "2024-11-13 22:24:01",
    "login_time": "2025-01-20 22:39:42"
  },
  "combat_plan": {
    "kongfu": {
      "main": "天地无极",
      "main_id": 20603,
      "main_level": 100,
      "sub": "九宫飞星",
      "sub_id": 20702,
      "sub_level": 100
    },
    "xinfa": {
      "active": [],
      "passive": [501, 81, 502, 504],
      "details": {
        "501": {"name": "内功心法", "rank": 6},
        "502": {"name": "外功心法", "rank": 6},
        "504": {"name": "身法心法", "rank": 6},
        "81": {"name": "基础心法", "rank": 6}
      }
    }
  },
  "equipment": [
    {
      "slot": "1",
      "no": 1101877,
      "name": "武器",
      "suffix": "套装名称",
      "suffix_id": 34,
      "durability": 52,
      "retoned": 0,
      "gain_ts": "2025-11-27 11:13:29",
      "safe_lock": true,
      "base_attrs": {
        "外功攻击上限": 203,
        "外功攻击下限": 87
      },
      "base_affixes": [
        {
          "id": 10613002,
          "name": "外功攻击",
          "value": 103.2,
          "rate": 97.7,
          "quality": "紫色",
          "is_max": true
        }
      ]
    }
  ],
  "club": {
    "name": "皆渡",
    "id": "aMKv4mtsmxzz2x2L",
    "hostnum": 10048
  },
  "real_attr": {
    "力量": 607.6,
    "体质": 242,
    "敏捷": 242,
    "基础": 242,
    "修为功夫": 44580,
    "会心": 436.392
  },
  "achievement": {
    "gold": 286,
    "silver": 149,
    "bronze": 41
  }
}
```

### 🛠️ 技术改进

#### 1. 单例模式配置管理
```python
class ConfigManager:
    _instance = None
    _lock = threading.Lock()
```

#### 2. 线程安全
- ✅ 多线程数据保存
- ✅ 配置加载线程安全
- ✅ 并发捕获支持

#### 3. 自动配置更新
```python
def load_or_download_configs(self):
    local_loaded = self.load_local_configs()
    if not local_loaded:
        self.download_configs()
```

#### 4. 错误处理优化
- ✅ 配置文件加载失败处理
- ✅ 网络请求超时处理
- ✅ JSON解析错误处理
- ✅ 数据保存异常处理

### 📈 性能优化

#### 内存优化
- ✅ 配置数据只加载一次
- ✅ 懒加载机制
- ✅ 数据结构精简

#### 启动速度
- ✅ 优先使用本地配置
- ✅ 异步下载配置
- ✅ 缓存机制优化

### 🔒 兼容性

#### Python版本
- ✅ Python 3.7+
- ✅ Python 3.8+
- ✅ Python 3.9+
- ✅ Python 3.10+
- ✅ Python 3.11+
- ✅ Python 3.12+

#### 操作系统
- ✅ Windows
- ✅ macOS
- ✅ Linux

#### mitmproxy版本
- ✅ mitmproxy 10.0+
- ✅ mitmproxy 11.0+
- ✅ mitmproxy 12.0+

### 📝 迁移指南

#### 从 v1.0 升级
1. **保留原有配置**
   - `captured_data/` 目录保持不变
   - 历史数据仍然有效

2. **使用新版脚本**
   - 建议使用 `network_monitor_v2.py`
   - 基础版 `network_monitor.py` 仍然可用

3. **可选：下载新配置**
   ```bash
   python config_downloader.py
   ```

4. **测试运行**
   ```bash
   python test_tool.py
   ```

### ❓ 常见问题

#### Q: 需要重新安装依赖吗？
A: 不需要，现有的依赖已经足够。只需确保安装了 `mitmproxy` 和 `requests`。

#### Q: 旧版本的数据还能用吗？
A: 可以，新版本完全兼容旧版本的数据格式。

#### Q: 如何回退到 v1.0？
A: 直接使用 `network_monitor.py`，配置文件功能是可选的。

#### Q: 配置文件多久更新一次？
A: 建议在游戏大版本更新后重新下载配置文件。平时无需频繁更新。

### 🎯 使用建议

#### 推荐工作流
1. **首次使用**
   ```bash
   python config_downloader.py  # 下载配置
   mitmweb -s network_monitor_v2.py  # 启动监控
   ```

2. **日常使用**
   ```bash
   mitmweb -s network_monitor_v2.py  # 直接启动
   ```

3. **查看数据**
   ```bash
   type captured_data\latest_character.json  # Windows
   cat captured_data/latest_character.json  # Linux/Mac
   ```

#### 数据分析
- 使用 `config_analyzer.py` 分析配置文件
- 使用 `test_tool.py` 测试工具完整性
- 查看 `network_monitor_COMPLETE_GUIDE.md` 了解完整功能

### 🔮 未来计划

#### v2.1 (计划中)
- ⏳ 支持更多游戏数据解析
- ⏳ 添加数据分析功能
- ⏳ 支持数据导出为Excel
- ⏳ 添加装备对比功能

#### v2.2 (计划中)
- ⏳ Web界面展示
- ⏳ 实时数据监控
- ⏳ 告警通知功能
- ⏳ 数据趋势分析

### 🙏 致谢

感谢所有用户的反馈和建议，使得 v2.0 版本能够提供更好的使用体验。

---

**版本**: 2.0  
**发布日期**: 2024-01  
**主要改进**: 配置文件集成 + 数据可读化  
**兼容性**: 完全向后兼容 v1.0
