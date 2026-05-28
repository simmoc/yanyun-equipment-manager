#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
应急恢复系统代理工具
用于在程序异常退出时恢复系统代理设置
"""

import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from proxy_manager import ProxyManager
except ImportError:
    print("错误：找不到 proxy_manager.py")
    print("请确保您在正确的目录下")
    sys.exit(1)


def main():
    print("=" * 60)
    print("   燕云角色信息收集工具 - 代理恢复工具")
    print("=" * 60)
    print()
    
    manager = ProxyManager()
    
    # Check if there's a saved config
    if manager.config_file.exists():
        print("发现保存的代理设置，正在恢复...")
    else:
        print("没有找到保存的代理设置")
        print()
        choice = input("是否仍然尝试清理系统代理? (y/n): ").strip().lower()
        if choice != 'y':
            print("已取消")
            return
    
    print()
    result = manager.restore_proxy()
    
    if result:
        print()
        print("=" * 60)
        print("✓ 系统代理已恢复！")
        print("=" * 60)
        print()
        print("现在您应该可以正常上网了")
    else:
        print()
        print("=" * 60)
        print("尝试直接关闭代理...")
        
        # Try to just disable proxy
        if manager.system == "Windows":
            try:
                import winreg
                key = winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                    0, winreg.KEY_SET_VALUE
                )
                winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 0)
                winreg.CloseKey(key)
                manager._notify_windows_proxy_change()
                print("✓ Windows 代理已关闭")
            except Exception as e:
                print(f"错误: {e}")
        elif manager.system == "Darwin":
            try:
                import subprocess
                # List all services
                result = subprocess.run(
                    ['networksetup', '-listallnetworkservices'],
                    capture_output=True, text=True
                )
                services = [s for s in result.stdout.splitlines() if s and not s.startswith('*')]
                for service in services:
                    subprocess.run(
                        ['networksetup', '-setwebproxystate', service, 'off'],
                        capture_output=True
                    )
                    subprocess.run(
                        ['networksetup', '-setsecurewebproxystate', service, 'off'],
                        capture_output=True
                    )
                print("✓ macOS 代理已关闭")
            except Exception as e:
                print(f"错误: {e}")
        elif manager.system == "Linux":
            try:
                import subprocess
                subprocess.run(
                    ['gsettings', 'set', 'org.gnome.system.proxy', 'mode', 'none'],
                    capture_output=True
                )
                print("✓ Linux 代理已关闭 (GNOME)")
            except Exception as e:
                print(f"错误: {e}")
                print()
                print("请手动在系统设置中关闭代理")
    
    # Clean up config file
    try:
        if manager.config_file.exists():
            manager.config_file.unlink()
            print()
            print("已清理配置文件")
    except Exception:
        pass
    
    print()
    input("按 Enter 键退出...")


if __name__ == "__main__":
    main()
