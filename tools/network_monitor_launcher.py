#!/usr/bin/env python3
import sys
import os
import subprocess
import json
import atexit
from pathlib import Path

# Import proxy manager
try:
    from proxy_manager import ProxyManager
    HAS_PROXY_MANAGER = True
except ImportError:
    HAS_PROXY_MANAGER = False


def print_banner():
    print("=" * 60)
    print("     燕云角色信息收集工具 - 启动器")
    print("=" * 60)
    print()


def check_exe_available():
    """检查是否有可执行文件可用"""
    exe_files = []
    exe_names = ["cert_installer.exe", "network_monitor.exe"]
    
    for name in exe_names:
        exe_path = Path(name)
        if exe_path.exists():
            exe_files.append(exe_path)
    
    release_dir = Path("release")
    if release_dir.exists():
        for name in exe_names:
            exe_path = release_dir / name
            if exe_path.exists():
                exe_files.append(exe_path)
    
    return len(exe_files) > 0


def print_menu(has_exe: bool = False):
    print("功能选项:")
    
    if HAS_PROXY_MANAGER:
        print("  [1] mitmweb + 自动设置系统代理 (推荐)")
        print("  [2] mitmweb - 可视化界面（增强版，不自动代理）")
    else:
        if has_exe:
            print("  [1] mitmweb - 可视化界面 (推荐)")
        else:
            print("  [1] mitmweb - 可视化界面（增强版）")
        print("  [2] mitmweb - 可视化界面（基础版）")
    
    print("  [3] mitmdump - 后台监听模式")
    
    if has_exe:
        print("  [4] 运行证书安装工具 (EXE)")
    
    print("  [5] 查看最新捕获的数据")
    print("  [6] 查看所有历史数据")
    print("  [7] 安装mitmproxy证书")
    
    if HAS_PROXY_MANAGER:
        print("  [8] 设置系统代理 (127.0.0.1:8080)")
        print("  [9] 恢复/禁用系统代理")
    
    print("  [10] 安装依赖")
    print("  [11] 下载游戏配置文件")
    print("  [12] 打开数据目录")
    print("  [0] 退出程序")
    print()


def install_dependencies():
    print("正在安装依赖...")
    print("=" * 60)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "network_monitor_requirements.txt"])
        print("=" * 60)
        print("✓ 依赖安装成功！")
    except Exception as e:
        print(f"✗ 安装失败: {e}")
    print()


def view_latest_data():
    latest_file = Path("captured_data/latest_character.json")
    if not latest_file.exists():
        print("✗ 尚未捕获任何数据")
        print("请先启动监听模式，然后登录游戏查看角色信息")
        return
    
    print("=" * 60)
    print("最新捕获的角色数据:")
    print("=" * 60)
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(json.dumps(data, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"✗ 读取失败: {e}")
    print("=" * 60)
    print()


def view_all_data():
    data_dir = Path("captured_data")
    if not data_dir.exists():
        print("✗ 数据目录不存在")
        return
    
    files = sorted(data_dir.glob("character_*.json"))
    if not files:
        print("✗ 没有任何历史数据")
        return
    
    print("=" * 60)
    print(f"共发现 {len(files)} 条历史记录:")
    print("=" * 60)
    for i, file in enumerate(files[:10], 1):
        print(f"  {i}. {file.name}")
    
    if len(files) > 10:
        print(f"  ... 还有 {len(files) - 10} 条记录")
    
    print()
    print("=" * 60)
    print()


def open_data_dir():
    data_dir = Path("captured_data")
    if not data_dir.exists():
        print("✗ 数据目录不存在")
        return
    
    try:
        if sys.platform == 'win32':
            os.startfile(str(data_dir))
        elif sys.platform == 'darwin':
            subprocess.run(['open', str(data_dir)])
        else:
            subprocess.run(['xdg-open', str(data_dir)])
        print(f"✓ 已打开目录: {data_dir.absolute()}")
    except Exception as e:
        print(f"✗ 无法打开目录: {e}")
    print()


def start_web_v2(with_proxy: bool = False):
    print("=" * 60)
    if with_proxy:
        print("启动 mitmweb + 自动系统代理（增强版）...")
    else:
        print("启动 mitmweb 可视化界面（增强版）...")
    print("=" * 60)
    print("提示:")
    print("  1. 启动后会自动打开浏览器")
    if not with_proxy:
        print("  2. 在浏览器中配置代理: 127.0.0.1:8080")
    else:
        print("  2. 系统代理已自动设置为 127.0.0.1:8080")
    print("  3. 登录燕云游戏并查看角色信息")
    print("  4. 程序会自动捕获并解析数据")
    print("  5. 按 Ctrl+C 停止监听")
    print("=" * 60)
    print()
    
    proxy_manager = None
    if with_proxy and HAS_PROXY_MANAGER:
        proxy_manager = ProxyManager()
        proxy_manager.set_proxy()
        # Register restore on exit
        atexit.register(proxy_manager.restore_proxy)
    
    try:
        subprocess.run(["mitmweb", "-s", "network_monitor_v2.py"])
    except KeyboardInterrupt:
        print("\n已停止监听")
    except Exception as e:
        print(f"✗ 启动失败: {e}")
        print("\n请确保已安装 mitmproxy:")
        print("  pip install mitmproxy")
    finally:
        # Restore proxy if needed
        if proxy_manager:
            print("\n正在恢复系统代理...")
            proxy_manager.restore_proxy()
    print()


def set_system_proxy():
    """设置系统代理"""
    if not HAS_PROXY_MANAGER:
        print("✗ 代理管理器不可用")
        return
    
    print("=" * 60)
    print("设置系统代理")
    print("=" * 60)
    print("\n这将把系统代理设置为 127.0.0.1:8080")
    print("停止时会自动恢复原来的设置")
    print()
    
    try:
        proxy_manager = ProxyManager()
        proxy_manager.set_proxy()
        atexit.register(proxy_manager.restore_proxy)
        
        print("\n✓ 系统代理已设置")
        print("\n按 Ctrl+C 恢复代理并退出...")
        try:
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n正在恢复系统代理...")
            proxy_manager.restore_proxy()
            print("✓ 代理已恢复")
    except Exception as e:
        print(f"✗ 设置代理失败: {e}")
    print()


def restore_system_proxy():
    """恢复/禁用系统代理"""
    if not HAS_PROXY_MANAGER:
        print("✗ 代理管理器不可用")
        return
    
    print("=" * 60)
    print("恢复/禁用系统代理")
    print("=" * 60)
    print()
    
    try:
        proxy_manager = ProxyManager()
        if proxy_manager.original_settings:
            print("找到保存的代理设置，正在恢复...")
            if proxy_manager.restore_proxy():
                print()
                print("✓ 系统代理已恢复到原来的设置")
            else:
                print()
                print("恢复失败，尝试禁用代理...")
                proxy_manager.disable_proxy()
        else:
            print("没有保存的代理设置，直接禁用代理")
            proxy_manager.disable_proxy()
    except Exception as e:
        print(f"✗ 操作失败: {e}")
        print()
        print("提示：您也可以运行 'python restore_proxy.py' 来应急恢复")
    print()


def start_web():
    print("=" * 60)
    print("启动 mitmweb 可视化界面（基础版）...")
    print("=" * 60)
    print("提示:")
    print("  1. 启动后会自动打开浏览器")
    print("  2. 在浏览器中配置代理: 127.0.0.1:8080")
    print("  3. 登录燕云游戏并查看角色信息")
    print("  4. 程序会自动捕获并解析数据")
    print("  5. 按 Ctrl+C 停止监听")
    print("=" * 60)
    print()
    
    try:
        subprocess.run(["mitmweb", "-s", "network_monitor.py"])
    except KeyboardInterrupt:
        print("\n已停止监听")
    except Exception as e:
        print(f"✗ 启动失败: {e}")
        print("\n请确保已安装 mitmproxy:")
        print("  pip install mitmproxy")
    print()


def start_dump():
    print("=" * 60)
    print("启动 mitmdump 后台监听...")
    print("=" * 60)
    print("提示:")
    print("  1. 启动后程序会在后台运行")
    print("  2. 需要在浏览器中配置代理: 127.0.0.1:8080")
    print("  3. 登录燕云游戏并查看角色信息")
    print("  4. 程序会自动捕获并解析数据")
    print("  5. 按 Ctrl+C 停止监听")
    print("=" * 60)
    print()
    
    try:
        subprocess.run(["mitmdump", "-s", "network_monitor_v2.py"])
    except KeyboardInterrupt:
        print("\n已停止监听")
    except Exception as e:
        print(f"✗ 启动失败: {e}")
        print("\n请确保已安装 mitmproxy:")
        print("  pip install mitmproxy")
    print()


def run_cert_installer_exe():
    """运行证书安装工具的EXE版本"""
    exe_names = [
        Path("cert_installer.exe"),
        Path("release/cert_installer.exe")
    ]
    
    for exe_path in exe_names:
        if exe_path.exists():
            print(f"找到: {exe_path}")
            
            try:
                if sys.platform == 'win32':
                    os.startfile(str(exe_path))
                else:
                    subprocess.run([str(exe_path)])
                
                return True
            except Exception as e:
                print(f"✗ 运行失败: {e}")
                return False
    
    print("✗ 找不到 cert_installer.exe")
    return False


def install_certificate():
    print("=" * 60)
    print("安装 mitmproxy 证书")
    print("=" * 60)
    print("\n证书安装是使用网络监控的关键步骤")
    print("这将让浏览器信任 mitmproxy 代理")
    print()
    
    # 检查是否有EXE版本
    exe_path = Path("cert_installer.exe")
    release_exe_path = Path("release/cert_installer.exe")
    
    if exe_path.exists() or release_exe_path.exists():
        choice = input("是否运行可执行文件版本? (Y/n): ").strip().lower()
        if choice not in ['n', 'no']:
            if run_cert_installer_exe():
                return
    
    try:
        subprocess.run([sys.executable, "cert_installer.py"])
    except Exception as e:
        print(f"✗ 启动证书安装程序失败: {e}")
        print("\n请尝试手动运行:")
        print("  python cert_installer.py")
    print()


def download_configs():
    print("=" * 60)
    print("下载游戏配置文件")
    print("=" * 60)
    print("\n配置文件用于将游戏ID转换为可读名称")
    print()
    
    try:
        subprocess.run([sys.executable, "config_downloader.py"])
    except Exception as e:
        print(f"✗ 启动配置下载程序失败: {e}")
        print("\n请尝试手动运行:")
        print("  python config_downloader.py")
    print()


def main():
    os.system('cls' if os.name == 'nt' else 'clear')
    print_banner()
    
    has_exe = check_exe_available()
    
    while True:
        print_menu(has_exe)
        choice = input("请选择操作: ").strip()
        print()
        
        if HAS_PROXY_MANAGER:
            if choice == '1':
                start_web_v2(with_proxy=True)
            elif choice == '2':
                start_web_v2(with_proxy=False)
            elif choice == '3':
                start_web()
            elif choice == '4':
                start_dump()
            elif choice == '5' and has_exe:
                run_cert_installer_exe()
            elif choice == '6':
                view_latest_data()
            elif choice == '7':
                view_all_data()
            elif choice == '8':
                install_certificate()
            elif choice == '9':
                set_system_proxy()
            elif choice == '10':
                restore_system_proxy()
            elif choice == '11':
                install_dependencies()
            elif choice == '12':
                download_configs()
            elif choice == '13':
                open_data_dir()
            elif choice == '0':
                print("感谢使用！再见！")
                break
            else:
                print("✗ 无效的选择，请输入正确的数字")
                print()
        else:
            if choice == '1':
                start_web_v2()
            elif choice == '2':
                start_web()
            elif choice == '3':
                start_dump()
            elif choice == '4' and has_exe:
                run_cert_installer_exe()
            elif choice == '5':
                view_latest_data()
            elif choice == '6':
                view_all_data()
            elif choice == '7':
                install_certificate()
            elif choice == '8':
                install_dependencies()
            elif choice == '9':
                download_configs()
            elif choice == '10':
                open_data_dir()
            elif choice == '0':
                print("感谢使用！再见！")
                break
            else:
                print("✗ 无效的选择，请输入正确的数字")
                print()
        
        if choice != '0':
            input("按 Enter 键继续...")


if __name__ == "__main__":
    main()
