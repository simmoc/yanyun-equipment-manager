# 燕云角色信息收集工具 - 快速入门

## 🎯 这是什么？

一个网络流量监控工具，可以自动捕获并解析燕云游戏角色信息，将复杂的游戏数据转换为易读的中文格式。

## ⚡ 30秒快速开始

### 方式一：使用可执行文件（最简单）

如果已经打包好了：

```batch
1. 双击 cert_installer.exe（右键 → 以管理员身份运行）
2. 双击 network_monitor_launcher.bat
3. 开始使用！
```

### 方式二：使用 Python 脚本

1. 安装依赖
```bash
pip install -r network_monitor_requirements.txt
```

2. 安装证书（重要！）
```bash
# 使用启动器
python network_monitor_launcher.py
# 选择选项 7: 安装 mitmproxy 证书

# 或直接运行证书工具
python cert_installer.py
```
> 💡 提示：程序会自动申请管理员权限，无需手动操作！

3. 启动
```bash
# Windows用户双击这个
network_monitor_launcher.bat

# 或命令行启动
python network_monitor_launcher.py
# 选择选项 1: mitmweb（增强版）
```

4. 配置代理
浏览器设置：`127.0.0.1:8080`

5. 查看角色
在游戏中查看角色信息，程序自动捕获数据

6. 查看结果
```
captured_data\latest_character.json
```

---

## 📦 打包成可执行文件

想把程序打包成 exe 给别人用？

### 快速打包

```batch
# Windows用户双击运行
build.bat

# 选择选项3 或 5
```

或使用 Python 脚本：

```bash
python build.py
```

打包完成后，在 `release` 目录可以找到可执行文件！

详细打包说明请见：`BUILD_GUIDE.md`

## ✨ 主要特性

### 📊 数据可读化
| 原始数据 | 可读化后 |
|---------|---------|
| school: 12 | school: "醉拳" |
| No: 1101877 | name: "武器" |
| 10613002 | "外功攻击" |
| 20603 | "天地无极" |

### 🎮 自动捕获
- ✅ 角色基础信息
- ✅ 装备详细信息
- ✅ 词缀属性评分
- ✅ 战斗配置（功法、心法）
- ✅ 帮派、成就等

### 📁 智能保存
- JSON格式，易于分析
- 自动命名（角色名+时间）
- 保留最新数据副本

## 📂 工具文件

```
project/
├── network_monitor_v2.py      # 主程序（推荐使用）
├── network_monitor.py         # 基础版程序
├── cert_installer.py          # ⭐ 证书自动安装工具
├── config_downloader.py       # 配置下载工具
├── test_tool.py              # 测试工具
├── config_data/               # 配置目录（自动创建）
│   ├── suffix_data.json       # 套装配置
│   ├── school_data.json       # 门派配置
│   └── equip_data.json       # 装备配置
├── captured_data/            # 数据目录（自动创建）
│   ├── latest_character.json # 最新数据
│   └── character_xxx.json     # 历史记录
├── network_monitor_launcher.py   # Python启动器
└── network_monitor_launcher.bat  # Windows快捷启动
```

## 📚 文档文件

```
project/
├── CERT_INSTALL_GUIDE.md      # 证书安装详细指南 ⭐
├── BUILD_GUIDE.md            # 打包和部署指南 ⭐
├── network_monitor_GETTING_STARTED.md  # 快速入门
├── network_monitor_COMPLETE_GUIDE.md  # 完整指南
├── network_monitor_CONFIG_README.md  # 配置说明
├── network_monitor_QUICKREF.md  # 快速参考
├── network_monitor_CHANGELOG.md  # 更新日志
└── network_monitor_README.md  # 基础说明
```

## 💡 常见场景

### 场景1：查看角色装备
```bash
# 启动后
mitmweb -s network_monitor_v2.py
# 在游戏中打开角色装备界面
# 查看 captured_data\latest_character.json
```

### 场景2：分析角色属性
```bash
# 查找real_attr字段
# 查看力量、体质、敏捷等属性
```

### 场景3：对比多个角色
```bash
# 多次捕获后
captured_data/
├── character_角色A_20240101_120000.json
├── character_角色B_20240101_130000.json
└── character_角色C_20240101_140000.json
```

### 场景4：更新配置文件
```bash
# 游戏更新后
python config_downloader.py --download
```

## 🎯 数据结构示例

```json
{
  "base": {
    "nickname": "再梦江南",
    "level": 100,
    "school": "醉拳",
    "online_time": "908小时30分钟"
  },
  "equipment": [
    {
      "name": "武器",
      "suffix": "套装名称",
      "base_affixes": [
        {
          "name": "外功攻击",
          "value": 103.2,
          "rate": 97.7,
          "quality": "紫色"
        }
      ]
    }
  ]
}
```

## ❓ 遇到问题？

### 无法启动？
```bash
pip install mitmproxy requests
```

### 无法捕获数据？
1. 配置浏览器代理：`127.0.0.1:8080`
2. **安装证书**（重要！）：
   ```bash
   python cert_installer.py
   ```
3. 或访问 `http://mitm.it`

### 证书安装后还是有警告？
- 重启浏览器
- 清除浏览器缓存
- Firefox 需要单独配置（见 CERT_INSTALL_GUIDE.md）

### 端口被占用？
```bash
mitmweb -p 8081 -s network_monitor_v2.py
```

### 想看详细文档？
- 📖 完整指南: `network_monitor_COMPLETE_GUIDE.md`
- 🔐 证书指南: `CERT_INSTALL_GUIDE.md`
- 📋 配置说明: `network_monitor_CONFIG_README.md`
- 📝 快速参考: `network_monitor_QUICKREF.md`

## 🔑 关键命令

```bash
# 启动（推荐）
mitmweb -s network_monitor_v2.py

# 后台运行
mitmdump -s network_monitor_v2.py

# 下载配置
python config_downloader.py

# 查看数据
type captured_data\latest_character.json

# Windows快捷启动
network_monitor_launcher.bat
```

## 📈 输出示例

### 原始数据 vs 可读化

**原始：**
```json
{
  "school": 12,
  "No": 1101877,
  "base_attrs": {"MAX_W_ATK": 203}
}
```

**可读化：**
```json
{
  "school": "醉拳",
  "name": "武器",
  "base_attrs": {"外功攻击上限": 203}
}
```

## 🎉 特色功能

1. **自动证书安装** - 一键安装mitmproxy证书（跨平台支持）
2. **自动配置下载** - 无需手动查找游戏数据
3. **智能名称映射** - ID自动转换为中文名称
4. **结构化输出** - 清晰的数据层级
5. **线程安全** - 支持并发操作
6. **容错处理** - 自动降级处理

## 🚀 性能

- 启动时间: < 2秒
- 数据捕获: < 100ms
- 配置下载: 自动（仅首次）
- 内存占用: < 50MB

## 📞 快速帮助

| 需求 | 命令/操作 |
|------|----------|
| 启动监控 | `mitmweb -s network_monitor_v2.py` |
| 查看数据 | `type captured_data\latest_character.json` |
| 更新配置 | `python config_downloader.py --download` |
| 测试工具 | `python test_tool.py` |

## ✅ 下一步

1. 尝试运行一次
2. 查看生成的数据
3. 根据需要调整配置
4. 享受便利的游戏数据分析！

---

**提示**: 首次使用建议阅读完整的 `network_monitor_COMPLETE_GUIDE.md`

**版本**: 2.0  
**推荐脚本**: `network_monitor_v2.py`
