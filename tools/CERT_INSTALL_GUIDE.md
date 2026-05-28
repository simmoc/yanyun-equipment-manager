# mitmproxy 证书自动化安装指南

## 📋 概述

使用网络监控工具时，最繁琐的步骤就是安装 SSL 证书。现在我们提供了自动化安装工具！

## 🚀 快速开始

### 方法1: 使用启动器（最简单）

#### Windows 用户
```bash
# 双击运行
network_monitor_launcher.bat

# 选择选项 6: 安装 mitmproxy 证书
```

#### 所有平台用户
```bash
# 运行启动器
python network_monitor_launcher.py

# 选择选项 6: 安装 mitmproxy 证书
```

### 方法2: 直接运行证书安装工具

```bash
python cert_installer.py
```

## 🔧 证书安装工具功能

### 自动检测
- ✓ 自动检测操作系统（Windows/macOS/Linux）
- ✓ 自动查找 mitmproxy 证书位置
- ✓ 自动检测管理员/root 权限

### Windows 系统
- 自动使用 certutil 命令安装
- 如果失败，提供详细的手动安装步骤
- 自动转换证书格式（需要 pyOpenSSL）
- 打开证书文件位置

### macOS 系统
- 使用 security 命令自动安装
- 提供详细的钥匙串安装步骤

### Linux 系统
- 自动检测发行版（Debian/RedHat/Arch）
- 自动安装到系统 CA 存储
- 提供各发行版的手动命令

## 📝 证书安装步骤说明

### Windows 详细步骤

#### 自动安装（推荐）
1. 右键点击 → 以管理员身份运行 `cert_installer.py`
2. 选择选项 1: 自动安装证书
3. 等待安装完成

#### 手动安装（如果自动失败）
1. 找到证书文件：`%APPDATA%\mitmproxy\mitmproxy-ca-cert.pem`
2. 双击证书文件
3. 点击 "安装证书"
4. 选择 "本地计算机"
5. 点击 "下一步"
6. 选择 "将所有证书都放入下列存储"
7. 点击 "浏览"
8. 选择 "受信任的根证书颁发机构"
9. 点击 "确定"
10. 点击 "下一步" → "完成"

### macOS 详细步骤

#### 自动安装
```bash
# 使用 sudo 运行
sudo python cert_installer.py
```

#### 手动安装
1. 找到证书文件：`~/.mitmproxy/mitmproxy-ca-cert.pem`
2. 双击证书文件
3. 钥匙串访问会打开
4. 选择 "系统" 钥匙串
5. 点击 "添加"
6. 输入管理员密码
7. 在系统钥匙串中找到证书
8. 右键 → 显示简介
9. 展开 "信任"
10. 设置 "使用此证书时" 为 "始终信任"
11. 关闭窗口，输入密码确认

### Linux 详细步骤

#### Debian/Ubuntu
```bash
sudo mkdir -p /usr/local/share/ca-certificates
sudo cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca.crt
sudo update-ca-certificates
```

#### RedHat/CentOS
```bash
sudo cp ~/.mitmproxy/mitmproxy-ca-cert.pem /etc/pki/ca-trust/source/anchors/mitmproxy-ca.crt
sudo update-ca-trust extract
```

#### Arch Linux
```bash
sudo cp ~/.mitmproxy/mitmproxy-ca-cert.pem /etc/ca-certificates/trust-source/anchors/mitmproxy-ca.crt
sudo trust extract-compat
```

## ✅ 验证安装

### 测试证书是否安装成功

1. 启动 mitmproxy
```bash
mitmweb -s network_monitor_v2.py
```

2. 配置浏览器代理：`127.0.0.1:8080`

3. 访问 HTTPS 网站，例如：https://example.com

4. 如果没有安全警告，说明证书安装成功！

### 使用浏览器测试

#### Chrome/Edge
- 访问：https://example.com
- 应该显示正常页面，没有红色警告

#### Firefox
- 访问：https://example.com
- 如果有警告，需要单独配置 Firefox（见下方）

## 🔧 常见问题

### Q: 证书安装后仍然有安全警告？

**A:** 
1. 重启浏览器
2. 清除浏览器缓存
3. Firefox 需要单独配置（见下方）

### Q: Firefox 如何配置？

**A:** Firefox 使用自己的证书存储，需要额外配置：

方法1: 使用 mitmproxy 配置
```
1. 启动 mitmweb
2. 访问 http://mitm.it
3. 点击 Firefox 图标
4. 按照说明安装证书
```

方法2: 手动配置
```
1. Firefox 地址栏输入: about:preferences#privacy
2. 滚动到 "证书" 部分
3. 点击 "查看证书"
4. 点击 "导入"
5. 选择: ~/.mitmproxy/mitmproxy-ca-cert.pem
6. 勾选 "信任此 CA 以识别网站"
7. 点击 "确定"
```

### Q: 如何卸载证书？

**Windows:**
```
1. Win+R → 输入 certmgr.msc
2. 展开 "受信任的根证书颁发机构"
3. 找到 mitmproxy 证书
4. 右键 → 删除
```

**macOS:**
```
1. 打开钥匙串访问
2. 选择 "系统" 钥匙串
3. 找到 mitmproxy 证书
4. 右键 → 删除
```

**Linux:**
```bash
# Debian/Ubuntu
sudo rm /usr/local/share/ca-certificates/mitmproxy-ca.crt
sudo update-ca-certificates --fresh

# RedHat/CentOS
sudo rm /etc/pki/ca-trust/source/anchors/mitmproxy-ca.crt
sudo update-ca-trust extract
```

### Q: 找不到 mitmproxy 证书？

**A:** 
1. 确保已安装 mitmproxy: `pip install mitmproxy`
2. 运行一次 mitmproxy 生成证书: `mitmdump`
3. 按 Ctrl+C 退出
4. 再运行证书安装工具

### Q: 权限不足怎么办？

**Windows:**
- 右键 → 以管理员身份运行

**macOS/Linux:**
- 使用 sudo: `sudo python cert_installer.py`

### Q: 需要安装 pyOpenSSL 吗？

**A:** 通常不需要。如果自动转换失败，可以安装：
```bash
pip install pyOpenSSL
```

## 📂 证书文件位置

| 系统 | 证书路径 |
|------|---------|
| Windows | `%APPDATA%\mitmproxy\mitmproxy-ca-cert.pem` |
| Windows (备选) | `%USERPROFILE%\.mitmproxy\mitmproxy-ca-cert.pem` |
| macOS | `~/.mitmproxy/mitmproxy-ca-cert.pem` |
| Linux | `~/.mitmproxy/mitmproxy-ca-cert.pem` |

## 🎯 推荐使用流程

### 首次使用
```
1. 安装依赖
   pip install -r network_monitor_requirements.txt

2. 运行证书安装工具
   python cert_installer.py

3. 下载配置文件
   python config_downloader.py

4. 启动监控
   python network_monitor_launcher.py
```

### 日常使用
```
1. 使用启动器
   python network_monitor_launcher.py

2. 选择选项 1: mitmweb（增强版）
3. 配置浏览器代理
4. 开始捕获！
```

## ⚠️ 安全提示

### mitmproxy 证书安全说明
- mitmproxy 生成的证书是自签名的，仅在您的计算机上有效
- 此证书用于拦截 HTTPS 流量，仅限个人使用
- 不要与他人分享此证书
- 仅用于合法的游戏数据分析

### 安全建议
1. 只在需要时启动代理
2. 使用完成后关闭代理
3. 定期清理捕获的数据
4. 遵守游戏用户协议

## 🔄 相关文档

- [完整使用指南](network_monitor_COMPLETE_GUIDE.md)
- [配置文件说明](network_monitor_CONFIG_README.md)
- [快速参考](network_monitor_QUICKREF.md)
- [更新日志](network_monitor_CHANGELOG.md)
