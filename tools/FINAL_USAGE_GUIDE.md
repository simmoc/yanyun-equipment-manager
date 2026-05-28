# 燕云角色信息收集工具 - 使用说明

## 概述

这是一个用于收集燕云角色信息的工具，可以捕获角色基础信息、面板属性、装备列表等数据。

## 文件说明

- `network_monitor_final.py` - 最终版本的mitmproxy脚本，直接处理原始数据格式
- `verify_and_parse.py` - 验证和解析脚本，用于测试数据解析
- `config_data/` - 配置数据目录
  - `affix_data.json` - 词缀数据
  - `suffix_data.json` - 套装数据
  - `school_data.json` - 门派数据
  - `equip_data.json` - 装备数据
- `captured_data/` - 捕获数据目录

## 环境配置

### 1. 检查Python

```bash
py --version
```

如果显示Python版本（如3.14.2），说明可以正常使用。

### 2. 安装依赖

```bash
pip install mitmproxy
```

## 使用方法

### 1. 启动mitmproxy

使用以下命令启动mitmweb：

```bash
mitmweb -s network_monitor_final.py
```

### 2. 配置代理

在浏览器或游戏中配置代理为：
- 代理地址：127.0.0.1
- 代理端口：8080

### 3. 查看角色信息

登录燕云游戏，查看角色信息页面，工具会自动捕获数据。

### 4. 查看捕获数据

工具会自动打印角色信息，并在 `captured_data/` 目录保存：
- `raw_YYYYMMDD_HHMMSS.json` - 原始数据
- `character_YYYYMMDD_HHMMSS.json` - 解析后的数据
- `latest_character.json` - 最新数据副本

## 数据说明

捕获的数据包含三部分：

### 1. 角色基础信息
- 角色名、门派、等级、修为
- 账号、编号、创建时间、最后登录
- 在线时长、帮会信息、成就

### 2. 角色面板属性
- 体质、劲力、机敏、气势、御劲
- 武林造诣

### 3. 角色装备列表
- 装备名称、套装信息
- 耐久度、重铸次数
- 基础属性、词缀属性（含满度百分比）

## 验证脚本

如果已有原始数据，可以使用验证脚本进行解析：

```bash
py verify_and_parse.py
```

## 常见问题

### Q: Python命令找不到怎么办？
A: 使用 `py` 命令代替 `python` 命令。

### Q: 如何停止mitmproxy？
A: 在终端按 `Ctrl + C` 停止。

### Q: 数据保存到哪里？
A: 所有捕获的数据都保存在 `captured_data/` 目录下。
