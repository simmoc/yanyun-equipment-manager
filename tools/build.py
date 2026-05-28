#!/usr/bin/env python3
import os
import sys
import subprocess
import shutil
from pathlib import Path


def check_pyinstaller_available():
    """检查PyInstaller是否安装"""
    try:
        import PyInstaller
        return True
    except ImportError:
        return False


def install_pyinstaller():
    """安装PyInstaller"""
    print("正在安装 PyInstaller...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✓ PyInstaller 安装成功")
        return True
    except Exception as e:
        print(f"✗ PyInstaller 安装失败: {e}")
        return False


def build_executable(script_name: str, spec_name: str = None):
    """构建可执行文件"""
    print(f"\n" + "=" * 60)
    print(f"正在构建 {script_name}")
    print("=" * 60)
    
    script_path = Path(script_name)
    if not script_path.exists():
        print(f"✗ 找不到 {script_name} 不存在")
        return False
    
    build_args = []
    
    if spec_name:
        spec_path = Path(spec_name)
        if spec_path.exists():
            build_args = [spec_name]
        else:
            build_args = [
                "--onefile",
                "--console",
                f"--name", spec_path.stem,
                script_name
            ]
    else:
        build_args = [
            "--onefile",
            "--console",
            script_name
        ]
    
    try:
        cmd = ["pyinstaller"] + build_args
        print(f"执行: {' '.join(cmd)}")
        
        subprocess.check_call(cmd)
        
        dist_path = Path("dist")
        if dist_path.exists():
            print(f"✓ 构建成功！")
            return True
        else:
            print("✗ 构建失败！")
            return False
            
    except Exception as e:
        print(f"✗ 构建失败: {e}")
        return False


def clean_build():
    """清理构建目录"""
    print("\n清理构建目录...")
    
    dirs_to_remove = ["build", "dist", "__pycache__"]
    
    for dir_name in dirs_to_remove:
        dir_path = Path(dir_name)
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"✓ 已删除: {dir_name}")
            except Exception as e:
                print(f"✗ 删除 {dir_name} 失败: {e}")
    
    spec_files = Path().glob("*.spec")
    for spec_file in spec_files:
        try:
            spec_file.unlink()
            print(f"✓ 已删除: {spec_file}")
        except Exception as e:
            print(f"✗ 删除 {spec_file} 失败: {e}")


def copy_to_release():
    """复制发布文件"""
    print("\n准备发布文件...")
    release_dir = Path("release")
    release_dir.mkdir(exist_ok=True)
    
    dist_dir = Path("dist")
    if not dist_dir.exists():
        print("✗ dist 目录不存在，没有可复制的文件")
        return False
    
    copied = 0
    for exe_file in dist_dir.glob("*.exe"):
        try:
            shutil.copy(exe_file, release_dir)
            print(f"✓ 复制: {exe_file.name}")
            copied += 1
        except Exception as e:
            print(f"✗ 复制 {exe_file.name} 失败: {e}")
    
    if copied > 0:
        print(f"\n✓ 成功复制 {copied} 个文件到 {release_dir}")
        return True
    else:
        print("\n✗ 没有找到可执行文件")
        return False


def main():
    print("=" * 60)
    print("  燕云角色信息收集工具 - 打包工具")
    print("=" * 60)
    
    if not check_pyinstaller_available():
        print("\nPyInstaller 未安装")
        choice = input("是否现在安装 PyInstaller? (Y/n): ").strip().lower()
        
        if choice not in ["n", "no"]:
            print("取消安装")
            return
        
        if not install_pyinstaller():
            print("\n无法继续，请先安装 PyInstaller")
            return
    
    print("\n请选择打包选项:")
    print("  1. 打包证书安装工具 (cert_installer)")
    print("  2. 打包网络监控工具 (network_monitor)")
    print("  3. 打包全部")
    print("  4. 清理构建文件")
    print("  0. 退出")
    
    choice = input("\n请输入选项 (0-4): ").strip()
    
    success = False
    
    if choice == "1":
        clean_build()
        success = build_executable("cert_installer.py", "cert_installer.spec")
        if success:
            copy_to_release()
    
    elif choice == "2":
        clean_build()
        success = build_executable("network_monitor_v2.py", "network_monitor.spec")
        if success:
            copy_to_release()
    
    elif choice == "3":
        clean_build()
        print("\n--- 第一部分：证书安装工具 ---")
        success1 = build_executable("cert_installer.py", "cert_installer.spec")
        print("\n--- 第二部分：网络监控工具 ---")
        success2 = build_executable("network_monitor_v2.py", "network_monitor.spec")
        
        if success1 or success2:
            copy_to_release()
        
        success = success1 and success2
    
    elif choice == "4":
        clean_build()
        print("\n✓ 清理完成")
        return
    
    elif choice == "0":
        print("\n再见!")
        return
    
    else:
        print("\n无效选项")
        return
    
    if success:
        print("\n" + "=" * 60)
        print("✓ 打包完成!")
        print("=" * 60)
        print("可执行文件在 release/ 目录中")
    else:
        print("\n" + "=" * 60)
        print("✗ 打包过程中有失败")
        print("=" * 60)


if __name__ == "__main__":
    main()
