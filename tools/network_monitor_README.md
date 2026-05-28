# 燕云角色信息收集工具

## 功能说明
此工具用于监听网络流量，自动捕获并解析燕云游戏角色信息。

## 工作原理
使用 mitmproxy 拦截 HTTPS 流量，监听目标API响应：
- API地址: `https://datamsapi.ds.163.com/v1/h72roletool/proxyGameRole`
- 自动解析角色基础信息、装备信息、战斗属性等

## 安装步骤

### 1. 安装 Python 依赖
```bash
pip install -r network_monitor_requirements.txt
```

### 2. 安装 mitmproxy 证书
首次运行时会自动生成证书，位置在用户目录下：
- Windows: `C:\Users\<用户名>\.mitmproxy\mitmproxy-ca-cert.pem`
- 需要将证书导入到系统信任根证书

### 3. 配置浏览器代理
- 代理地址: `127.0.0.1`
- 代理端口: `8080`
- 建议使用 Firefox 浏览器（支持手动代理配置）

## 使用方法

### 启动监听模式（基础版）
```bash
python network_monitor.py
```

### 使用 mitmweb（推荐，可视化界面 - 基础版）
```bash
mitmweb -s network_monitor.py
```

### 使用 mitmweb（增强版 - 推荐使用，可读化配置）
```bash
mitmweb -s network_monitor_v2.py
```

增强版会自动下载游戏配置文件，对数据进行可读化处理。

### 使用 mitmdump（后台运行）
```bash
mitmdump -s network_monitor_v2.py
```

### 下载配置文件（可选）
如果使用增强版，配置文件会自动下载。也可以手动下载：
```bash
python config_downloader.py
```

## 配置说明

### 目标URL
在代码中配置（默认已设置）：
```python
TARGET_URL = "datamsapi.ds.163.com"
TARGET_PATH = "/v1/h72roletool/proxyGameRole"
```

### 游戏配置文件
增强版会自动下载以下配置文件，实现数据可读化：
- **套装配置**: `https://s.166.net/config/ds_h72/suffix_data.json`
- **门派配置**: `https://s.166.net/config/ds_h72/school_data.json`
- **装备配置**: `https://s.166.net/config/ds_h72/equip_data.json`

配置文件保存在 `config_data/` 目录。

### 数据保存位置
- 默认保存在 `./captured_data/` 目录
- 最新数据: `captured_data/latest_character.json`
- 历史数据: `captured_data/character_<角色名>_<时间戳>.json`

## 捕获的数据内容

### 基础信息
- 角色名称、等级、门派
- 创建时间、在线时长
- 最近在线天数统计

### 战斗信息
- 功法（主副）
- 心法配置
- 战斗技能等级

### 装备信息
- 所有已穿戴装备
- 装备词缀属性
- 装备评分
- 强化/重铸次数

### 其他信息
- 帮派信息
- 成就统计
- 时装评分
- 称号列表
- 野外装备等级

## 示例响应数据格式
```json
{
  "base": {
    "nickname": "角色名称",
    "level": 100,
    "school": "门派",
    "online_time": "总在线时长",
    ...
  },
  "combat_plan": {
    "kongfu": {
      "main": "主功法",
      "sub": "副功法"
    },
    "xinfa": {...},
    "wear_equips": [...]
  },
  "equipment": [...],
  ...
}
```

## 常见问题

### Q: 无法捕获HTTPS流量？
A: 需要安装并信任mitmproxy证书到系统。

### Q: 代理端口被占用？
A: 可以修改端口：mitmweb -p 8081 -s network_monitor.py

### Q: 想要只捕获特定角色的数据？
A: 程序会自动捕获所有请求，无需额外配置。

## 注意事项
- 仅用于个人游戏数据分析
- 请遵守游戏用户协议
- 妥善保管捕获的数据
- 定期清理captured_data目录避免占用过多空间
