#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
System Proxy Manager
Automatically set system proxy to mitmproxy and restore on exit.

Supports:
- Windows (registry)
- macOS (networksetup)
- Linux (gsettings for GNOME, others need manual config)
"""

import os
import sys
import json
import atexit
import signal
import subprocess
import platform
from pathlib import Path


class ProxyManager:
    """System proxy manager for Yan Yun Character Info Tool"""
    
    DEFAULT_PROXY_HOST = '127.0.0.1'
    DEFAULT_PROXY_PORT = 8080
    
    def __init__(self, host=None, port=None):
        self.host = host or self.DEFAULT_PROXY_HOST
        self.port = port or self.DEFAULT_PROXY_PORT
        self.proxy_server = f'{self.host}:{self.port}'
        self.system = platform.system()
        self.original_settings = None
        self.config_file = Path.home() / '.yanyun_proxy_config.json'
        self._setup_signal_handlers()
        self._load_saved_config()
    
    def _setup_signal_handlers(self):
        """Set up signal handlers for emergency restore"""
        def signal_handler(sig, frame):
            print(f'\n[Proxy] Received signal {sig}, restoring proxy...')
            self.restore_proxy()
            sys.exit(0)
        
        # Handle common signals
        signals_to_handle = []
        for sig_name in ['SIGINT', 'SIGTERM']:
            if hasattr(signal, sig_name):
                signals_to_handle.append(getattr(signal, sig_name))
        
        # SIGQUIT is not available on Windows
        if hasattr(signal, 'SIGQUIT'):
            signals_to_handle.append(signal.SIGQUIT)
        
        for sig in signals_to_handle:
            try:
                signal.signal(sig, signal_handler)
            except Exception:
                pass
    
    def _load_saved_config(self):
        """Load previously saved proxy settings"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self.original_settings = json.load(f)
                print(f'[Proxy] Loaded saved settings from {self.config_file}')
            except Exception as e:
                print(f'[Proxy] Warning: Failed to load saved config: {e}')
                self.original_settings = None
    
    def _save_config(self, config):
        """Save current proxy settings to file"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            self.original_settings = config
            print(f'[Proxy] Saved settings to {self.config_file}')
        except Exception as e:
            print(f'[Proxy] WARNING: Failed to save config: {e}')
    
    def _clear_config(self):
        """Clear saved config"""
        if self.config_file.exists():
            try:
                self.config_file.unlink()
                print(f'[Proxy] Cleared config file')
            except Exception as e:
                print(f'[Proxy] Warning: Failed to clear config: {e}')
    
    def get_current_proxy(self):
        """Get current system proxy settings"""
        if self.system == 'Windows':
            return self._get_windows_proxy()
        elif self.system == 'Darwin':  # macOS
            return self._get_macos_proxy()
        elif self.system == 'Linux':
            return self._get_linux_proxy()
        else:
            print(f'[WARNING] Unsupported system: {self.system}')
            return None
    
    def set_proxy(self):
        """Set system proxy to mitmproxy"""
        print(f'[Proxy] Setting system proxy to {self.proxy_server}')
        
        # First save current settings
        current = self.get_current_proxy()
        if current:
            self._save_config(current)
        else:
            print('[Proxy] No current proxy settings found to save')
        
        # Set proxy
        if self.system == 'Windows':
            return self._set_windows_proxy()
        elif self.system == 'Darwin':
            return self._set_macos_proxy()
        elif self.system == 'Linux':
            return self._set_linux_proxy()
        else:
            print(f'[ERROR] Unsupported system: {self.system}')
            return False
    
    def restore_proxy(self):
        """Restore original proxy settings"""
        print('[Proxy] Restoring original proxy settings...')
        
        if not self.original_settings:
            print('[Proxy] No original proxy settings saved, trying to just disable proxy...')
            return self.disable_proxy()
        
        if self.system == 'Windows':
            result = self._restore_windows_proxy()
        elif self.system == 'Darwin':
            result = self._restore_macos_proxy()
        elif self.system == 'Linux':
            result = self._restore_linux_proxy()
        else:
            print(f'[ERROR] Unsupported system: {self.system}')
            return False
        
        if result:
            print('[Proxy] ✓ Proxy settings restored!')
            self._clear_config()
        return result
    
    def disable_proxy(self):
        """Just disable proxy (without restoring previous settings)"""
        print('[Proxy] Disabling system proxy...')
        
        if self.system == 'Windows':
            try:
                import winreg
                key = winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                    0, winreg.KEY_SET_VALUE
                )
                winreg.SetValueEx(key, 'ProxyEnable', 0, winreg.REG_DWORD, 0)
                winreg.CloseKey(key)
                self._notify_windows_proxy_change()
                print('[Proxy] ✓ Windows proxy disabled')
                self._clear_config()
                return True
            except Exception as e:
                print(f'[Proxy] Error: {e}')
                return False
        elif self.system == 'Darwin':
            try:
                import subprocess
                result = subprocess.run(
                    ['networksetup', '-listallnetworkservices'],
                    capture_output=True, text=True
                )
                services = [s for s in result.stdout.splitlines() 
                           if s and not s.startswith('*')]
                for service in services:
                    subprocess.run(
                        ['networksetup', '-setwebproxystate', service, 'off'],
                        capture_output=True
                    )
                    subprocess.run(
                        ['networksetup', '-setsecurewebproxystate', service, 'off'],
                        capture_output=True
                    )
                print('[Proxy] ✓ macOS proxy disabled')
                self._clear_config()
                return True
            except Exception as e:
                print(f'[Proxy] Error: {e}')
                return False
        elif self.system == 'Linux':
            try:
                import subprocess
                subprocess.run(
                    ['gsettings', 'set', 'org.gnome.system.proxy', 'mode', 'none'],
                    capture_output=True
                )
                print('[Proxy] ✓ Linux proxy disabled (GNOME)')
                self._clear_config()
                return True
            except Exception as e:
                print(f'[Proxy] Error: {e}')
                print('[Proxy] Please manually disable proxy in system settings')
                return False
        else:
            print(f'[ERROR] Unsupported system: {self.system}')
            return False
    
    # === Windows ===
    
    def _get_windows_proxy(self):
        """Get Windows proxy settings from registry"""
        import winreg
        
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r'Software\Microsoft\Windows\CurrentVersion\Internet Settings',
                0, winreg.KEY_READ
            )
            
            settings = {
                'system': 'Windows',
                'ProxyEnable': 0,
                'ProxyServer': '',
                'AutoConfigURL': ''
            }
            
            # Check known values
            for value in ['ProxyEnable', 'ProxyServer', 'AutoConfigURL']:
                try:
                    val, _ = winreg.QueryValueEx(key, value)
                    settings[value] = val
                except FileNotFoundError:
                    pass
            
            winreg.CloseKey(key)
            return settings
        except Exception as e:
            print(f'[ERROR] Failed to get Windows proxy: {e}')
            return None
    
    def _set_windows_proxy(self):
        """Set Windows proxy via registry"""
        import winreg
        
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r'Software\Microsoft\Windows\CurrentVersion\Internet Settings',
                0, winreg.KEY_SET_VALUE
            )
            
            # Set proxy
            winreg.SetValueEx(key, 'ProxyEnable', 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(key, 'ProxyServer', 0, winreg.REG_SZ, 
                             f'http={self.proxy_server};https={self.proxy_server}')
            
            # Clear auto config
            try:
                winreg.DeleteValue(key, 'AutoConfigURL')
            except FileNotFoundError:
                pass
            
            winreg.CloseKey(key)
            
            # Notify system of change
            self._notify_windows_proxy_change()
            
            print(f'[Proxy] Windows proxy set to {self.proxy_server}')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to set Windows proxy: {e}')
            return False
    
    def _restore_windows_proxy(self):
        """Restore Windows proxy settings"""
        import winreg
        
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r'Software\Microsoft\Windows\CurrentVersion\Internet Settings',
                0, winreg.KEY_SET_VALUE
            )
            
            settings = self.original_settings
            
            # Restore ProxyEnable
            if 'ProxyEnable' in settings:
                winreg.SetValueEx(key, 'ProxyEnable', 0, winreg.REG_DWORD, 
                                 int(settings['ProxyEnable']))
            else:
                winreg.DeleteValue(key, 'ProxyEnable')
            
            # Restore ProxyServer
            if 'ProxyServer' in settings and settings['ProxyServer']:
                winreg.SetValueEx(key, 'ProxyServer', 0, winreg.REG_SZ, 
                                 settings['ProxyServer'])
            else:
                try:
                    winreg.DeleteValue(key, 'ProxyServer')
                except FileNotFoundError:
                    pass
            
            # Restore AutoConfigURL
            if 'AutoConfigURL' in settings and settings['AutoConfigURL']:
                winreg.SetValueEx(key, 'AutoConfigURL', 0, winreg.REG_SZ, 
                                 settings['AutoConfigURL'])
            else:
                try:
                    winreg.DeleteValue(key, 'AutoConfigURL')
                except FileNotFoundError:
                    pass
            
            winreg.CloseKey(key)
            
            # Notify system of change
            self._notify_windows_proxy_change()
            
            print('[Proxy] Windows proxy restored')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to restore Windows proxy: {e}')
            return False
    
    def _notify_windows_proxy_change(self):
        """Notify Windows of proxy settings change"""
        try:
            import ctypes
            INTERNET_OPTION_SETTINGS_CHANGED = 39
            INTERNET_OPTION_REFRESH = 37
            ctypes.windll.wininet.InternetSetOptionW(
                0, INTERNET_OPTION_SETTINGS_CHANGED, 0, 0
            )
            ctypes.windll.wininet.InternetSetOptionW(
                0, INTERNET_OPTION_REFRESH, 0, 0
            )
        except Exception:
            pass
    
    # === macOS ===
    
    def _get_macos_proxy(self):
        """Get macOS proxy settings using networksetup"""
        try:
            # Get network service
            result = subprocess.run(
                ['networksetup', '-listallnetworkservices'],
                capture_output=True, text=True
            )
            services = [s for s in result.stdout.splitlines() 
                       if s and not s.startswith('*')]
            if not services:
                return None
            
            primary_service = services[0]
            
            settings = {
                'system': 'Darwin',
                'service': primary_service,
                'HTTPEnable': 0,
                'HTTPPort': 0,
                'HTTPProxy': '',
                'HTTPSEnable': 0,
                'HTTPSPort': 0,
                'HTTPSProxy': ''
            }
            
            # Get HTTP proxy
            result = subprocess.run(
                ['networksetup', '-getwebproxy', primary_service],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if line.startswith('Enabled: '):
                    settings['HTTPEnable'] = 1 if line.endswith('Yes') else 0
                elif line.startswith('Server: '):
                    settings['HTTPProxy'] = line.split('Server: ')[1]
                elif line.startswith('Port: '):
                    settings['HTTPPort'] = int(line.split('Port: ')[1])
            
            # Get HTTPS proxy
            result = subprocess.run(
                ['networksetup', '-getsecurewebproxy', primary_service],
                capture_output=True, text=True
            )
            for line in result.stdout.splitlines():
                line = line.strip()
                if line.startswith('Enabled: '):
                    settings['HTTPSEnable'] = 1 if line.endswith('Yes') else 0
                elif line.startswith('Server: '):
                    settings['HTTPSProxy'] = line.split('Server: ')[1]
                elif line.startswith('Port: '):
                    settings['HTTPSPort'] = int(line.split('Port: ')[1])
            
            return settings
        except Exception as e:
            print(f'[ERROR] Failed to get macOS proxy: {e}')
            return None
    
    def _set_macos_proxy(self):
        """Set macOS proxy using networksetup"""
        try:
            settings = self.original_settings
            if not settings or 'service' not in settings:
                # Try to get service
                result = subprocess.run(
                    ['networksetup', '-listallnetworkservices'],
                    capture_output=True, text=True
                )
                services = [s for s in result.stdout.splitlines() 
                           if s and not s.startswith('*')]
                if not services:
                    print('[ERROR] No network services found')
                    return False
                service = services[0]
            else:
                service = settings['service']
            
            # Set HTTP proxy
            subprocess.run(
                ['networksetup', '-setwebproxy', service, self.host, str(self.port)],
                capture_output=True
            )
            
            # Set HTTPS proxy
            subprocess.run(
                ['networksetup', '-setsecurewebproxy', service, self.host, str(self.port)],
                capture_output=True
            )
            
            print(f'[Proxy] macOS proxy set to {self.proxy_server}')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to set macOS proxy: {e}')
            return False
    
    def _restore_macos_proxy(self):
        """Restore macOS proxy settings"""
        try:
            settings = self.original_settings
            if not settings or 'service' not in settings:
                print('[ERROR] No saved macOS proxy settings')
                return False
            
            service = settings['service']
            
            # Restore HTTP proxy
            if settings.get('HTTPEnable'):
                subprocess.run(
                    ['networksetup', '-setwebproxy', service, 
                     settings.get('HTTPProxy', ''), str(settings.get('HTTPPort', 8080))],
                    capture_output=True
                )
            else:
                subprocess.run(
                    ['networksetup', '-setwebproxystate', service, 'off'],
                    capture_output=True
                )
            
            # Restore HTTPS proxy
            if settings.get('HTTPSEnable'):
                subprocess.run(
                    ['networksetup', '-setsecurewebproxy', service, 
                     settings.get('HTTPSProxy', ''), str(settings.get('HTTPSPort', 8080))],
                    capture_output=True
                )
            else:
                subprocess.run(
                    ['networksetup', '-setsecurewebproxystate', service, 'off'],
                    capture_output=True
                )
            
            print('[Proxy] macOS proxy restored')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to restore macOS proxy: {e}')
            return False
    
    # === Linux ===
    
    def _get_linux_proxy(self):
        """Get Linux proxy settings (GNOME gsettings)"""
        try:
            # Try GNOME settings
            result = subprocess.run(
                ['gsettings', 'get', 'org.gnome.system.proxy', 'mode'],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                # Not GNOME, return minimal info
                return {'system': 'Linux', 'mode': 'none'}
            
            mode = result.stdout.strip().strip("'")
            
            settings = {
                'system': 'Linux',
                'mode': mode
            }
            
            if mode == 'manual':
                # Get HTTP proxy
                result = subprocess.run(
                    ['gsettings', 'get', 'org.gnome.system.proxy.http', 'host'],
                    capture_output=True, text=True
                )
                settings['HTTPHost'] = result.stdout.strip().strip("'")
                
                result = subprocess.run(
                    ['gsettings', 'get', 'org.gnome.system.proxy.http', 'port'],
                    capture_output=True, text=True
                )
                settings['HTTPPort'] = int(result.stdout.strip())
                
                # Get HTTPS proxy
                result = subprocess.run(
                    ['gsettings', 'get', 'org.gnome.system.proxy.https', 'host'],
                    capture_output=True, text=True
                )
                settings['HTTPSHost'] = result.stdout.strip().strip("'")
                
                result = subprocess.run(
                    ['gsettings', 'get', 'org.gnome.system.proxy.https', 'port'],
                    capture_output=True, text=True
                )
                settings['HTTPSPort'] = int(result.stdout.strip())
            
            return settings
        except Exception as e:
            print(f'[ERROR] Failed to get Linux proxy: {e}')
            return {'system': 'Linux', 'mode': 'unknown'}
    
    def _set_linux_proxy(self):
        """Set Linux proxy (GNOME gsettings)"""
        try:
            # Try GNOME settings
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy', 'mode', 'manual'],
                capture_output=True
            )
            
            # Set HTTP proxy
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy.http', 'host', self.host],
                capture_output=True
            )
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy.http', 'port', str(self.port)],
                capture_output=True
            )
            
            # Set HTTPS proxy
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy.https', 'host', self.host],
                capture_output=True
            )
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy.https', 'port', str(self.port)],
                capture_output=True
            )
            
            print(f'[Proxy] Linux proxy set to {self.proxy_server} (GNOME)')
            print('[NOTE] For other DEs, please set proxy manually')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to set Linux proxy: {e}')
            print('[NOTE] Please set proxy manually in your system settings')
            return False
    
    def _restore_linux_proxy(self):
        """Restore Linux proxy settings"""
        try:
            settings = self.original_settings
            if not settings:
                print('[ERROR] No saved Linux proxy settings')
                return False
            
            # Restore mode
            mode = settings.get('mode', 'none')
            subprocess.run(
                ['gsettings', 'set', 'org.gnome.system.proxy', 'mode', mode],
                capture_output=True
            )
            
            if mode == 'manual':
                # Restore HTTP proxy
                if 'HTTPHost' in settings:
                    subprocess.run(
                        ['gsettings', 'set', 'org.gnome.system.proxy.http', 'host', 
                         settings['HTTPHost']],
                        capture_output=True
                    )
                if 'HTTPPort' in settings:
                    subprocess.run(
                        ['gsettings', 'set', 'org.gnome.system.proxy.http', 'port', 
                         str(settings['HTTPPort'])],
                        capture_output=True
                    )
                
                # Restore HTTPS proxy
                if 'HTTPSHost' in settings:
                    subprocess.run(
                        ['gsettings', 'set', 'org.gnome.system.proxy.https', 'host', 
                         settings['HTTPSHost']],
                        capture_output=True
                    )
                if 'HTTPSPort' in settings:
                    subprocess.run(
                        ['gsettings', 'set', 'org.gnome.system.proxy.https', 'port', 
                         str(settings['HTTPSPort'])],
                        capture_output=True
                    )
            
            print('[Proxy] Linux proxy restored')
            return True
        except Exception as e:
            print(f'[ERROR] Failed to restore Linux proxy: {e}')
            return False


def main():
    """Main function for testing"""
    import time
    
    print('=== Proxy Manager Test ===')
    print(f'System: {platform.system()}')
    
    manager = ProxyManager()
    
    # Show current proxy
    print('\nCurrent proxy settings:')
    current = manager.get_current_proxy()
    if current:
        for k, v in current.items():
            print(f'  {k}: {v}')
    
    # Ask to set proxy
    print('\nDo you want to set proxy to 127.0.0.1:8080? (y/n)')
    choice = input().strip().lower()
    
    if choice == 'y':
        # Register restore on exit
        atexit.register(manager.restore_proxy)
        
        # Set proxy
        manager.set_proxy()
        
        print('\nProxy set! Press Ctrl+C to restore and exit...')
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print('\nRestoring...')
    
    print('Done.')


if __name__ == '__main__':
    main()