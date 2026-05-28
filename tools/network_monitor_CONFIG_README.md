# 燕云角色信息收集工具 - 配置文件说明

## 新增配置文件功能

### 配置文件来源
工具会自动从以下地址下载游戏配置数据：

1. **套装基础信息** (suffix_data)
   - URL: `https://s.166.net/config/ds_h72/suffix_data.json`
   - 用途: 解析装备套装名称

2. **门派基础信息** (school_data)
   - URL: `https://s.166.net/config/ds_h72/school_data.json`
   - 用途: 解析门派名称

3. **装备基础信息** (equip_data)
   - URL: `https://s.166.net/config/ds_h72/equip_data.json`
   - 用途: 解析装备名称

## 使用方法

### 方式一：使用配置文件下载工具（推荐）

#### 1. 下载配置文件
```bash
python config_downloader.py
```

#### 2. 强制重新下载（如有更新）
```bash
python config_downloader.py --download
```

#### 3. 检查本地配置
```bash
python config_downloader.py --check
```

### 方式二：使用新版监控脚本（已集成配置功能）

```bash
mitmweb -s network_monitor_v2.py
```

`network_monitor_v2.py` 会在首次运行时自动下载配置文件，并使用这些配置对捕获的数据进行可读化处理。

## 可读化示例

### 原始数据
```json
{
  "base": {
    "school": 12
  }
}
```

### 可读化后
```json
{
  "base": {
    "school": "醉拳",
    "school_id": 12
  }
}
```

### 装备信息可读化

**原始数据：**
```json
{
  "No": 1101877,
  "suffix": 34,
  "ex": {
    "base_affixes": [
      [10613002, 103.2, 0.977, 3, true],
      [10693002, 64.8, 0.970, 3, true]
    ]
  }
}
```

**可读化后：**
```json
{
  "no": 1101877,
  "name": "武器",
  "suffix": "套装名称",
  "suffix_id": 34,
  "base_affixes": [
    {
      "id": 10613002,
      "name": "外功攻击",
      "value": 103.2,
      "rate": 97.7,
      "quality": "紫色",
      "is_max": true
    },
    {
      "id": 10693002,
      "name": "内功攻击",
      "value": 64.8,
      "rate": 97.0,
      "quality": "紫色",
      "is_max": true
    }
  ]
}
```

### 基础属性可读化

**原始数据：**
```json
{
  "MAX_W_ATK": 203,
  "MIN_W_ATK": 87
}
```

**可读化后：**
```json
{
  "外功攻击上限": 203,
  "外功攻击下限": 87
}
```

## 配置数据结构

### suffix_data.json (套装配置)
```json
{
  "套装ID": {
    "name": "套装名称",
    "level": 等级,
    "type": 类型
  }
}
```

### school_data.json (门派配置)
```json
{
  "门派ID": {
    "name": "门派名称",
    "description": "门派描述"
  }
}
```

### equip_data.json (装备配置)
```json
{
  "装备编号": {
    "name": "装备名称",
    "type": "装备类型",
    "level": 等级
  }
}
```

## 配置管理

### 配置保存位置
所有配置保存在 `config_data/` 目录：
- `config_data/suffix_data.json` - 套装配置
- `config_data/school_data.json` - 门派配置
- `config_data/equip_data.json` - 装备配置

### 配置更新策略
1. 首次运行自动下载
2. 配置文件会保存在本地
3. 如需更新，删除 `config_data/` 目录后重新运行
4. 或使用 `--download` 参数强制重新下载

## 词缀名称映射

工具内置了常用词缀ID的中文名称映射：

| 词缀ID | 名称 | 说明 |
|--------|------|------|
| 10613002 | 外功攻击 | 外功系攻击属性 |
| 10693002 | 内功攻击 | 内功系攻击属性 |
| 10693021 | 会心伤害 | 暴击伤害加成 |
| 10693012 | 会心几率 | 暴击概率 |
| 10693119 | 生命值 | 最大生命值 |
| 10643004 | 防御 | 防御属性 |
| 10673002 | 弓箭伤害 | 弓箭武器伤害 |
| 10683003 | 穿刺 | 穿刺伤害 |
| 10684002 | 弓箭攻击 | 弓箭基础攻击 |
| 10672002 | 弓箭增伤 | 弓箭伤害加成 |

## 功法名称映射

| 功法ID | 名称 |
|--------|------|
| 20603 | 天地无极 |
| 20702 | 九宫飞星 |
| 20501 | 不动如山 |
| 20502 | 疾风步 |
| 20601 | 万剑归宗 |
| 20701 | 天罗地网 |

## 心法名称映射

| 心法ID | 名称 |
|--------|------|
| 501 | 内功心法 |
| 502 | 外功心法 |
| 504 | 身法心法 |
| 81 | 基础心法 |

## 装备品质等级

| 等级 | 名称 | 颜色 |
|------|------|------|
| 1 | 绿色 | 绿色 |
| 2 | 蓝色 | 蓝色 |
| 3 | 紫色 | 紫色 |
| 4 | 橙色 | 橙色 |
| 5 | 粉色 | 粉色 |

## 数据输出示例

### 完整输出结构
```json
{
  "capture_time": "2024-01-01T12:00:00",
  "base": {
    "nickname": "再梦江南",
    "level": 100,
    "school": "醉拳",
    "school_id": 12,
    "online_time": "908小时30分钟15秒",
    "online_seconds": 3270591.24
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
    "xinfa": {...}
  },
  "equipment": [
    {
      "slot": "1",
      "no": 1101877,
      "name": "武器",
      "suffix": "套装名称",
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
  "club": {...},
  "real_attr": {...},
  "achievement": {...}
}
```

## 常见问题

### Q: 配置文件下载失败怎么办？
A: 
1. 检查网络连接
2. 手动访问URL确认可访问
3. 清除 `config_data/` 目录后重试
4. 使用浏览器下载配置文件后放入 `config_data/` 目录

### Q: 如何添加新的词缀名称映射？
A: 编辑 `network_monitor_v2.py`，修改 `ConfigManager.init_affix_names()` 方法。

### Q: 配置文件会过期吗？
A: 燕云游戏更新后可能需要重新下载配置文件，建议定期更新。

### Q: 可以同时使用两个版本的监控脚本吗？
A: 
- `network_monitor.py` - 基础版，使用内置映射
- `network_monitor_v2.py` - 增强版，使用配置文件

建议使用 `network_monitor_v2.py`。

## 相关文件

- `config_downloader.py` - 配置文件下载工具
- `network_monitor_v2.py` - 集成配置文件功能的监控脚本
- `config_data/` - 配置文件保存目录
- `captured_data/` - 角色数据保存目录

## 更新日志

### v2.0 (2024-01)
- 新增配置文件自动下载功能
- 支持套装、门派、装备名称可读化
- 新增词缀属性中文名称映射
- 优化装备数据结构输出
- 添加功法、心法名称映射

### v1.0 (2024-01)
- 初始版本
- 基础网络流量监控功能
- 角色信息解析
- 数据保存功能
