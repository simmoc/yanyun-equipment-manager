# 角色数据调试说明

## 问题描述
当前捕获的角色数据显示异常，门派和装备信息无法正常显示。

## 解决方案

### 步骤 1：使用新的调试版本
请使用 `network_monitor_v3.py`，这个版本会：
1. 保存完整的原始响应数据
2. 在日志中打印数据结构信息
3. 保存原始数据在解析结果中

### 步骤 2：运行调试
```bash
# 使用 mitmweb 运行调试版本
mitmweb -s network_monitor_v3.py
```

### 步骤 3：登录游戏查看角色
登录燕云游戏，查看角色信息，这会触发数据捕获。

### 步骤 4：查看保存的数据
捕获完成后，查看 `captured_data` 文件夹中的文件：
- `raw_YYYYMMDD_HHMMSS.json` - 完整的原始响应
- `latest_character.json` - 解析后的数据（包含原始数据）

## 数据文件说明

### captured_data/ 文件夹
- `raw_*.json` - 完整原始响应（重要！）
- `character_*.json` - 解析后的角色数据
- `latest_character.json` - 最新数据的快捷方式

### config_data/ 文件夹
- `suffix_data.json` - 套装配置
- `school_data.json` - 门派配置
- `equip_data.json` - 装备配置

## 调试要点

请查看 `raw_*.json` 文件，确认：
1. 数据结构是否与预期一致
2. `base.school` 字段是否存在
3. `combat_plan.wear_equips` 字段是否有数据
4. 数据键名是否匹配

## 如果发现数据结构有变化

如果发现实际数据结构与代码中的解析逻辑不匹配，请提供：
1. `raw_*.json` 文件内容
2. 或者具体的数据结构说明

## 回退选项

如果 v3 版本有问题，可以继续使用 v2 版本：
```bash
mitmweb -s network_monitor_v2.py
```
