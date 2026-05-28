# 燕云角色信息收集工具 - 打包和部署指南

## 目录

1. [快速开始](#快速开始)
2. [打包工具介绍](#打包工具介绍)
3. [打包步骤](#打包步骤)
4. [部署说明](#部署说明)
5. [常见问题](#常见问题)

---

## 快速开始

### 最简单的打包方式（Windows用户）

```batch
# 1. 双击运行
build.bat

# 2. 选择选项3 或 5 进行打包
```

### 跨平台打包（推荐）

```bash
# 1. 安装 PyInstaller
pip install pyinstaller

# 2. 运行打包脚本
python build.py
```

---

## 打包工具介绍

本项目提供两种打包方式：

### 1. Python打包脚本 (`build.py`) - 推荐

这是一个跨平台的Python脚本，提供完整的打包功能：

- 自动检查并安装 PyInstaller
- 支持单独打包或全部打包
- 自动清理临时文件
- 生成的文件自动复制到 `release` 目录
- 友好的交互式菜单

### 2. Windows批处理脚本 (`build.bat`)

专为Windows用户设计的批处理脚本：

- 一键运行，无需命令行知识
- 提供多种打包选项
- 包含清理和构建功能

### 3. 单独的 Spec 文件

- `cert_installer.spec` - 证书安装工具的打包配置
- `network_monitor.spec` - 网络监控工具的打包配置

---

## 打包步骤

### 准备工作

#### 1. 确保已安装 Python 3.7+

```bash
python --version
```

#### 2. 安装项目依赖

```bash
pip install -r network_monitor_requirements.txt
```

#### 3. 安装 PyInstaller

```bash
pip install pyinstaller
```

### 使用 Python 打包脚本（推荐）

#### 1. 运行打包脚本

```bash
python build.py
```

#### 2. 选择操作

脚本会显示以下菜单：

```
请选择打包选项:
  1. 打包证书安装工具 (cert_installer)
  2. 打包网络监控工具 (network_monitor)
  3. 打包全部
  4. 清理构建文件
  0. 退出
```

#### 3. 查看结果

打包完成后，在 `release` 目录可以找到生成的可执行文件：

```
release/
├── cert_installer.exe    (或对应平台的可执行文件)
└── network_monitor.exe   (或对应平台的可执行文件)
```

### 使用 Windows 批处理脚本

直接双击运行 `build.bat`，然后按菜单提示操作。

### 手动使用 PyInstaller 打包

如果需要更多自定义选项，可以手动使用 PyInstaller 打包：

#### 打包证书安装工具

```bash
# 使用 spec 文件打包
pyinstaller cert_installer.spec

# 或者直接打包源文件
pyinstaller --onefile --console --name cert_installer cert_installer.py
```

#### 打包网络监控工具

```bash
# 使用 spec 文件打包
pyinstaller network_monitor.spec

# 或者直接打包源文件
pyinstaller --onefile --console --name network_monitor network_monitor_v2.py
```

### PyInstaller 常用选项说明

| 选项 | 说明 |
|------|------|
| `--onefile` | 打包成单个可执行文件 |
| `--windowed` | 不显示控制台窗口（GUI应用） |
| `--console` | 显示控制台窗口（默认） |
| `--name NAME` | 指定输出文件名称 |
| `--icon FILE` | 指定图标文件 |
| `--add-data SRC;DST` | 添加数据文件 |

---

## 部署说明

### Windows 部署

#### 1. 准备发布文件

将以下文件打包到发布文件夹：

```
燕云角色信息收集工具/
├── cert_installer.exe       (证书安装工具，必须)
├── network_monitor.exe      (网络监控工具，必须)
├── network_monitor_v2.py    (源文件，可选)
├── config_downloader.py     (配置下载工具，可选)
├── network_monitor_launcher.bat  (启动器，推荐)
├── network_monitor_launcher.py   (启动器，推荐)
├── network_monitor_requirements.txt (依赖说明，可选)
└── README.*                  (文档，推荐)
```

#### 2. 使用说明文档

为用户准备简短的使用说明：

```txt
=======================================
    燕云角色信息收集工具
=======================================

快速开始:
  1. 右键点击 cert_installer.exe 并选择"以管理员身份运行"
  2. 运行 network_monitor_launcher.bat 或 network_monitor_launcher.py
  3. 配置浏览器代理为 127.0.0.1:8080
  4. 登录游戏查看角色信息

证书安装只需要做一次！
```

### Linux / macOS 部署

#### 1. 准备发布文件

```
燕云角色信息收集工具/
├── cert_installer          (证书安装工具，必须)
├── network_monitor         (网络监控工具，必须)
├── network_monitor_v2.py   (源文件，可选)
├── config_downloader.py    (配置下载工具，可选)
├── network_monitor_launcher.py (启动器，推荐)
├── network_monitor_requirements.txt (依赖说明，可选)
└── README.*                 (文档，推荐)
```

#### 2. 设置执行权限

```bash
chmod +x cert_installer network_monitor
```

#### 3. 使用说明

```bash
# 安装证书（需要root权限）
sudo ./cert_installer

# 运行启动器
./network_monitor_launcher.py
```

---

## 自动提权功能说明

### Windows 系统

`cert_installer.py` 包含了自动申请管理员权限的功能：

1. 程序启动时检查是否有管理员权限
2. 如果没有，自动以管理员身份重新启动
3. 弹出 UAC 确认对话框
4. 用户确认后，程序以管理员权限继续执行

无需手动右键选择"以管理员身份运行"，程序会自动处理！

### Linux / macOS 系统

1. 程序检测是否有 root 权限
2. 如果没有，自动使用 `sudo` 重新启动
3. 用户输入密码后，程序以 root 权限继续执行

---

## 常见问题

### 打包相关

#### Q: 打包失败，提示找不到模块?

**A:** 确保所有依赖都已安装，然后重新打包：

```bash
pip install -r network_monitor_requirements.txt
pyinstaller --clean your_script.py
```

#### Q: 生成的可执行文件很大?

**A:** PyInstaller 会打包整个 Python 环境，这是正常的。可以尝试：
- 使用虚拟环境
- 只安装必要的包
- 使用 UPX 压缩（PyInstaller 会自动检测）

#### Q: 打包后无法运行?

**A:** 检查以下几点：
1. 确保所有依赖都正确安装
2. 尝试使用 `--debug=all` 选项重新打包查看调试信息
3. 检查杀毒软件是否误报

#### Q: 杀毒软件报毒怎么办?

**A:** PyInstaller 打包的程序可能被误报，这是常见现象。可以：
- 将文件加入白名单
- 检查代码安全
- 向杀毒软件厂商提交误报

### 证书安装相关

#### Q: Windows 系统提示权限不足?

**A:** 
1. 程序应该会自动申请权限，如果没有，手动右键 → "以管理员身份运行"
2. 或者使用手动安装方式（程序提供的选项2）

#### Q: Linux 系统提示找不到 sudo?

**A:** 可以尝试：
1. 以 root 用户登录
2. 使用 su 切换到 root
3. 手动安装证书（程序提供的选项2）

#### Q: 浏览器仍然提示证书不安全?

**A:** 尝试以下步骤：
1. 完全关闭浏览器再重新打开
2. 清除浏览器缓存和证书缓存
3. Firefox 需要单独配置（见 CERT_INSTALL_GUIDE.md）
4. 重新安装证书

### 其他

#### Q: 如何自定义 spec 文件?

**A:** 可以编辑 .spec 文件添加更多配置，比如：
- 添加图标
- 添加数据文件
- 自定义导入
- 更多自定义选项

查看 PyInstaller 文档获取更多信息。

#### Q: 可以打包成安装包吗?

**A:** 可以！可以使用 Inno Setup (Windows), NSIS, 或其他工具将可执行文件和资源打包成安装包。

---

## 技术支持

如果遇到问题：
1. 先查看文档和常见问题
2. 检查是否有新版本
3. 查看详细的错误日志
4. 收集必要信息后寻求帮助

---

## 附录

### PyInstaller 常用命令

```bash
# 基本打包
pyinstaller script.py

# 单个文件
pyinstaller --onefile script.py

# 不显示控制台（GUI）
pyinstaller --onefile --windowed script.py

# 自定义名称
pyinstaller --onefile --name myapp script.py

# 清理后重新构建
pyinstaller --clean script.py

# 查看详细输出
pyinstaller --debug=all script.py
```

### 项目文件清单

```
打包和部署相关文件：
├── build.py                  Python 打包脚本（推荐）
├── build.bat                 Windows 批处理打包脚本
├── cert_installer.spec       证书工具打包配置
├── network_monitor.spec      网络监控工具打包配置
├── BUILD_GUIDE.md            本文档
└── CERT_INSTALL_GUIDE.md     证书安装指南
```

---

祝打包顺利！
