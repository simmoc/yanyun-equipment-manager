# 快速开始指南

## 环境要求
- Python 3.7+
- mitmproxy

## 快速启动步骤

### 第一步：安装依赖
```bash
pip install -r network_monitor_requirements.txt
```

### 第二步：运行启动器
```bash
python network_monitor_launcher.py
```

### 第三步：配置浏览器代理
1. 启动监听模式（选择选项1或2）
2. 配置浏览器代理：
   - 地址：`127.0.0.1`
   - 端口：`8080`
3. 访问任意HTTPS网站，安装mitmproxy证书

### 第四步：捕获数据
1. 清除浏览器缓存
2. 登录燕云游戏
3. 查看角色信息
4. 程序自动捕获并保存数据

### 第五步：查看结果
在 `captured_data/` 目录查看捕获的数据：
- `latest_character.json` - 最新角色数据
- `character_xxx_timestamp.json` - 历史记录

## Windows 用户快速启动
双击运行 `network_monitor_launcher.bat`

## 常见问题
详见 `network_monitor_README.md`
