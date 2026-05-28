#!/usr/bin/env python3
import os
import sys
import platform
import subprocess
import ctypes
import shutil
from pathlib import Path
from typing import Optional


def check_admin() -> bool:
    """检查是否有管理员/root权限"""
    system = platform.system()
    
    if system == "Windows":
        try:
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except:
            return False
    else:
        try:
            return os.geteuid() == 0
        except AttributeError:
            return False


def elevate_privileges():
    """申请提升权限（自动以管理员/root身份重启）"""
    system = platform.system()
    
    if check_admin():
        return True
    
    if system == "Windows":
        try:
            import ctypes.wintypes
            
            print("\n⚠ 需要管理员权限")
            print("正在请求管理员权限...")
            
            script = os.path.abspath(sys.argv[0])
            
            if not sys.executable.endswith("python.exe") and not sys.executable.endswith("pythonw.exe"):
                ctypes.windll.shell32.ShellExecuteW(
                    None, "runas", script, None, None, 1
                )
            else:
                ctypes.windll.shell32.ShellExecuteW(
                    None, "runas", sys.executable, script, None, 1
                )
            
            sys.exit(0)
        except Exception as e:
            print(f"提升权限失败: {e}")
            print("\n请手动以管理员身份运行此程序")
            sys.exit(1)
    
    elif system == "Darwin" or system == "Linux":
        try:
            print("\n⚠ 需要root权限")
            print("正在请求root权限...")
            
            if not shutil.which("sudo"):
                print("✗ 未找到 sudo 命令")
                print("请手动以 root 身份运行此程序")
                sys.exit(1)
            
            script = os.path.abspath(sys.argv[0])
            
            if sys.executable:
                args = [sys.executable, script] + sys.argv[1:]
            else:
                args = [script] + sys.argv[1:]
            
            os.execvp("sudo", ["sudo"] + args)
        except Exception as e:
            print(f"提升权限失败: {e}")
            print("\n请手动以 root 身份运行此程序")
            sys.exit(1)
    
    return False


def get_mitmproxy_cert_path() -> Optional[Path]:
    """获取mitmproxy证书路径"""
    system = platform.system()
    
    if system == "Windows":
        app_data = os.environ.get("APPDATA")
        if app_data:
            cert_path = Path(app_data) / "mitmproxy" / "mitmproxy-ca-cert.pem"
            if cert_path.exists():
                return cert_path
        
        home = Path.home()
        cert_path = home / ".mitmproxy" / "mitmproxy-ca-cert.pem"
        if cert_path.exists():
            return cert_path
        
        return None
        
    elif system == "Darwin":
        home = Path.home()
        cert_path = home / ".mitmproxy" / "mitmproxy-ca-cert.pem"
        if cert_path.exists():
            return cert_path
        return None
        
    elif system == "Linux":
        home = Path.home()
        cert_path = home / ".mitmproxy" / "mitmproxy-ca-cert.pem"
        if cert_path.exists():
            return cert_path
        return None
        
    return None


def install_cert_windows(cert_path: Path) -> bool:
    """Windows系统安装证书"""
    print("=" * 60)
    print("Windows 证书安装")
    print("=" * 60)
    
    cert_p12 = cert_path.with_suffix('.p12')
    
    if not cert_p12.exists():
        print(f"\n正在转换证书格式...")
        try:
            from OpenSSL import crypto
        except ImportError:
            print("\n需要安装 pyOpenSSL:")
            print("pip install pyOpenSSL")
            return False
        
        try:
            with open(cert_path, 'rb') as f:
                cert = crypto.load_certificate(crypto.FILETYPE_PEM, f.read())
            
            pkcs12 = crypto.PKCS12()
            pkcs12.set_certificate(cert)
            p12_data = pkcs12.export()
            
            with open(cert_p12, 'wb') as f:
                f.write(p12_data)
            
            print(f"✓ 证书转换成功: {cert_p12}")
        except Exception as e:
            print(f"✗ 证书转换失败: {e}")
            print("\n请手动安装 PEM 格式证书:")
            print_manual_install_steps_windows(cert_path)
            return False
    
    print(f"\n证书文件: {cert_path}")
    
    if not check_admin():
        print("\n⚠ 需要管理员权限")
        print("尝试自动提升权限...")
        if not elevate_privileges():
            return False
    
    try:
        print("\n正在使用 certutil 安装证书...")
        result = subprocess.run(
            ["certutil", "-addstore", "Root", str(cert_path)],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        
        if result.returncode == 0:
            print("✓ 证书安装成功!")
            return True
        else:
            print(f"certutil 返回错误码: {result.returncode}")
            print(f"错误输出: {result.stderr}")
            print(f"\n尝试其他方式...")
    
    except Exception as e:
        print(f"✗ certutil 命令失败: {e}")
    
    print("\n请使用手动安装方式:")
    print_manual_install_steps_windows(cert_path)
    return False


def print_manual_install_steps_windows(cert_path: Path):
    """打印Windows手动安装步骤"""
    print("\n" + "=" * 60)
    print("Windows 手动证书安装步骤")
    print("=" * 60)
    print(f"\n证书文件位置: {cert_path}")
    print("\n步骤:")
    print("  1. 双击证书文件 (mitmproxy-ca-cert.pem)")
    print("  2. 点击 \"安装证书\" 按钮")
    print("  3. 选择 \"本地计算机\" (Local Machine)")
    print("  4. 点击 \"下一步\"")
    print("  5. 选择 \"将所有证书都放入下列存储\"")
    print("  6. 点击 \"浏览\"")
    print("  7. 选择 \"受信任的根证书颁发机构\"")
    print("  8. 点击 \"确定\"")
    print("  9. 点击 \"下一步\"")
    print(" 10. 点击 \"完成\"")
    print(" 11. 如果出现安全警告，点击 \"是\"")
    print("\n安装完成后，请重启浏览器")


def install_cert_macos(cert_path: Path) -> bool:
    """macOS系统安装证书"""
    print("=" * 60)
    print("macOS 证书安装")
    print("=" * 60)
    
    print(f"\n证书文件: {cert_path}")
    
    if not check_admin():
        print("\n⚠ 需要 root 权限")
        print("尝试自动提升权限...")
        if not elevate_privileges():
            return False
    
    try:
        print("\n正在使用 security 命令安装证书...")
        
        result = subprocess.run(
            ["sudo", "security", "add-trusted-cert", "-d", "-r", "trustRoot", "-k",
             "/Library/Keychains/System.keychain", str(cert_path)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✓ 证书安装成功!")
            return True
        else:
            print(f"✗ 自动安装失败")
            print_manual_install_steps_macos(cert_path)
            return False
            
    except Exception as e:
        print(f"✗ 安装过程出错: {e}")
        print_manual_install_steps_macos(cert_path)
        return False


def print_manual_install_steps_macos(cert_path: Path):
    """打印macOS手动安装步骤"""
    print("\n" + "=" * 60)
    print("macOS 手动证书安装步骤")
    print("=" * 60)
    print(f"\n证书文件位置: {cert_path}")
    print("\n步骤:")
    print("  1. 双击证书文件 (mitmproxy-ca-cert.pem)")
    print("  2. 钥匙串访问程序会打开")
    print("  3. 在 \"添加证书\" 对话框中，选择 \"系统\" (System)")
    print("  4. 点击 \"添加\"")
    print("  5. 输入管理员密码")
    print("  6. 在系统钥匙串中找到证书")
    print("  7. 右键点击证书 → 显示简介")
    print("  8. 展开 \"信任\"")
    print("  9. 将 \"使用此证书时\" 设为 \"始终信任\"")
    print(" 10. 关闭窗口，输入管理员密码确认")
    print("\n安装完成后，请重启浏览器")


def install_cert_linux(cert_path: Path) -> bool:
    """Linux系统安装证书"""
    print("=" * 60)
    print("Linux 证书安装")
    print("=" * 60)
    
    print(f"\n证书文件: {cert_path}")
    
    if Path("/etc/debian_version").exists():
        return install_cert_debian(cert_path)
    elif Path("/etc/redhat-release").exists():
        return install_cert_redhat(cert_path)
    elif Path("/etc/arch-release").exists():
        return install_cert_arch(cert_path)
    else:
        print_manual_install_steps_linux(cert_path)
        return False


def install_cert_debian(cert_path: Path) -> bool:
    """Debian/Ubuntu系统安装证书"""
    print("\n检测到 Debian/Ubuntu 系统")
    
    if not check_admin():
        print("\n⚠ 需要 root 权限")
        print("尝试自动提升权限...")
        if not elevate_privileges():
            return False
    
    dest_dir = Path("/usr/local/share/ca-certificates")
    dest_file = dest_dir / "mitmproxy-ca.crt"
    
    try:
        if not dest_dir.exists():
            subprocess.run(["mkdir", "-p", str(dest_dir)], check=True)
        
        subprocess.run(["cp", str(cert_path), str(dest_file)], check=True)
        subprocess.run(["update-ca-certificates"], check=True)
        
        print("✓ 证书安装成功!")
        return True
        
    except Exception as e:
        print(f"✗ 安装失败: {e}")
        print_manual_install_steps_linux(cert_path)
        return False


def install_cert_redhat(cert_path: Path) -> bool:
    """RedHat/CentOS系统安装证书"""
    print("\n检测到 RedHat/CentOS 系统")
    
    if not check_admin():
        print("\n⚠ 需要 root 权限")
        print("尝试自动提升权限...")
        if not elevate_privileges():
            return False
    
    dest_dir = Path("/etc/pki/ca-trust/source/anchors")
    dest_file = dest_dir / "mitmproxy-ca.crt"
    
    try:
        subprocess.run(["cp", str(cert_path), str(dest_file)], check=True)
        subprocess.run(["update-ca-trust", "extract"], check=True)
        
        print("✓ 证书安装成功!")
        return True
        
    except Exception as e:
        print(f"✗ 安装失败: {e}")
        print_manual_install_steps_linux(cert_path)
        return False


def install_cert_arch(cert_path: Path) -> bool:
    """Arch Linux系统安装证书"""
    print("\n检测到 Arch Linux 系统")
    
    if not check_admin():
        print("\n⚠ 需要 root 权限")
        print("尝试自动提升权限...")
        if not elevate_privileges():
            return False
    
    dest_dir = Path("/etc/ca-certificates/trust-source/anchors")
    dest_file = dest_dir / "mitmproxy-ca.crt"
    
    try:
        subprocess.run(["cp", str(cert_path), str(dest_file)], check=True)
        subprocess.run(["trust", "extract-compat"], check=True)
        
        print("✓ 证书安装成功!")
        return True
        
    except Exception as e:
        print(f"✗ 安装失败: {e}")
        print_manual_install_steps_linux(cert_path)
        return False


def print_manual_install_steps_linux(cert_path: Path):
    """打印Linux手动安装步骤"""
    print("\n" + "=" * 60)
    print("Linux 证书安装步骤")
    print("=" * 60)
    print(f"\n证书文件位置: {cert_path}")
    print("\nDebian/Ubuntu:")
    print("  sudo mkdir -p /usr/local/share/ca-certificates")
    print(f"  sudo cp {cert_path} /usr/local/share/ca-certificates/mitmproxy-ca.crt")
    print("  sudo update-ca-certificates")
    print("\nRedHat/CentOS:")
    print(f"  sudo cp {cert_path} /etc/pki/ca-trust/source/anchors/mitmproxy-ca.crt")
    print("  sudo update-ca-trust extract")
    print("\nArch Linux:")
    print(f"  sudo cp {cert_path} /etc/ca-certificates/trust-source/anchors/mitmproxy-ca.crt")
    print("  sudo trust extract-compat")
    print("\n安装完成后，请重启浏览器")


def generate_certificates():
    """尝试生成mitmproxy证书"""
    print("\n证书不存在，尝试生成...")
    try:
        subprocess.run(
            ["mitmdump", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("正在生成证书，请稍候...")
        import threading
        import time
        
        def start_mitmdump():
            try:
                subprocess.run(["mitmdump", "--set", "console_eventlog_verbosity=error"],
                             timeout=5, capture_output=True)
            except subprocess.TimeoutExpired:
                pass
        
        thread = threading.Thread(target=start_mitmdump)
        thread.start()
        
        time.sleep(3)
        
        cert_path = get_mitmproxy_cert_path()
        if cert_path and cert_path.exists():
            print("✓ 证书生成成功!")
            return True
        else:
            print("✗ 证书生成失败，请手动运行 mitmproxy 一次")
            return False
            
    except FileNotFoundError:
        print("✗ 未找到 mitmproxy 命令")
        print("请先安装 mitmproxy: pip install mitmproxy")
        return False
    except Exception as e:
        print(f"✗ 证书生成过程出错: {e}")
        return False


def main():
    print("=" * 60)
    print("  燕云角色信息收集工具 - 证书自动安装")
    print("=" * 60)
    
    system = platform.system()
    print(f"\n检测到操作系统: {system}")
    
    cert_path = get_mitmproxy_cert_path()
    
    if not cert_path or not cert_path.exists():
        print("\n✗ 未找到 mitmproxy 证书")
        
        if system == "Windows":
            print("查找路径:")
            print(f"  %APPDATA%\\mitmproxy\\")
            print("  %USERPROFILE%\\.mitmproxy\\")
        
        if generate_certificates():
            cert_path = get_mitmproxy_cert_path()
            if cert_path:
                print(f"\n✓ 找到证书: {cert_path}")
            else:
                print("\n请按任意键退出...")
                input()
                return
        else:
            print("\n请按任意键退出...")
            input()
            return
    
    print(f"\n✓ 找到证书: {cert_path}")
    
    print("\n" + "=" * 60)
    print("证书安装选项")
    print("=" * 60)
    print("\n请选择:")
    print("  1. 自动安装证书 (推荐)")
    print("  2. 查看手动安装步骤")
    print("  3. 打开证书文件位置")
    print("  0. 退出")
    
    choice = input("\n请输入选项 (0-3): ").strip()
    
    if choice == "1":
        if system == "Windows":
            install_cert_windows(cert_path)
        elif system == "Darwin":
            install_cert_macos(cert_path)
        elif system == "Linux":
            install_cert_linux(cert_path)
        else:
            print(f"✗ 不支持的系统: {system}")
            
    elif choice == "2":
        if system == "Windows":
            print_manual_install_steps_windows(cert_path)
        elif system == "Darwin":
            print_manual_install_steps_macos(cert_path)
        elif system == "Linux":
            print_manual_install_steps_linux(cert_path)
            
    elif choice == "3":
        import webbrowser
        cert_dir = cert_path.parent
        print(f"\n打开目录: {cert_dir}")
        
        if system == "Windows":
            os.startfile(str(cert_dir))
        elif system == "Darwin":
            subprocess.run(["open", str(cert_dir)])
        else:
            try:
                subprocess.run(["xdg-open", str(cert_dir)])
            except:
                print("请手动打开此目录")
                
    elif choice == "0":
        print("\n再见!")
    else:
        print("\n无效选项")
    
    print("\n" + "=" * 60)
    print("\n按任意键退出...")
    try:
        input()
    except:
        pass


if __name__ == "__main__":
    main()
