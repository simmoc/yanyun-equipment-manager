'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { GameRole } from '@/types';
import { fetchNetEaseRoles } from '@/lib/neteaseClient';

interface AuthCache {
  cookies: any;
  loginToken: string;
  roles: GameRole[];
  timestamp: number;
}

interface QRCodeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cookies: any, loginToken: string, roles: GameRole[]) => void;
}

export function QRCodeAuthModal({ isOpen, onClose, onSuccess }: QRCodeAuthModalProps) {
  const [step, setStep] = useState<'qrcode' | 'loading'>('qrcode');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uuid, setUuid] = useState('');
  const [status, setStatus] = useState<'waiting' | 'confirming' | 'scanned'>('waiting');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasInitRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasInitRef.current) {
        hasInitRef.current = true;
        checkAuthCache();
      }
    } else {
      hasInitRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setQrCodeUrl('');
      setUuid('');
      setStatus('waiting');
      setStep('qrcode');
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen]);

  const checkAuthCache = async () => {
    try {
      const cachedAuth = localStorage.getItem('qrcode_auth_cache');
      if (cachedAuth) {
        const cache: AuthCache = JSON.parse(cachedAuth);
        const now = Date.now();
        if (now - cache.timestamp < 24 * 60 * 60 * 1000) {
          setStep('loading');
          const valid = await validateCache(cache);
          if (valid) {
            // 直接调用 onSuccess 并关闭
            onSuccess(cache.cookies, cache.loginToken, cache.roles);
            onClose();
            return;
          }
        }
      }
      setStep('qrcode');
      initQRCode();
    } catch (error) {
      console.error('检查缓存失败:', error);
      setStep('qrcode');
      initQRCode();
    }
  };

  const validateCache = async (cache: AuthCache): Promise<boolean> => {
    try {
      const result = await fetchNetEaseRoles(cache.cookies, cache.loginToken);
      return result.success && result.data?.roles?.length > 0;
    } catch (error) {
      return false;
    }
  };

  const saveAuthCache = (cookies: any, loginToken: string, roles: GameRole[]) => {
    const cache: AuthCache = {
      cookies,
      loginToken,
      roles,
      timestamp: Date.now()
    };
    localStorage.setItem('qrcode_auth_cache', JSON.stringify(cache));
  };

  useEffect(() => {
    if (!qrCodeUrl || !canvasRef.current) return;
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current, qrCodeUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).catch(console.error);
    });
  }, [qrCodeUrl]);

  const initQRCode = async () => {
    try {
      setError('');
      // 清除之前的轮询定时器
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      const response = await fetch('/api/auth/qrcode', {
        cache: 'no-store'
      });
      const result = await response.json();

      if (result.success) {
        setQrCodeUrl(result.data.qrCodeUrl);
        setUuid(result.data.uuid);
        startPolling(result.data.uuid);
      } else {
        setError(result.error || '获取二维码失败');
      }
    } catch (error) {
      setError('获取二维码失败');
    }
  };

  const startPolling = (qrUuid: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/poll?uuid=${qrUuid}`, {
          cache: 'no-store'
        });
        const result = await response.json();

        if (result.success) {
          if (result.data.status === 'confirming') {
            setStatus('confirming');
          } else if (result.data.status === 'scanned') {
            setStatus('scanned');
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            fetchRoles(result.data.cookies, result.data.loginToken);
          }
        }
      } catch (error) {
        console.error('轮询失败:', error);
      }
    }, 1000);
  };

  const fetchRoles = async (cookies: any, loginToken: string) => {
    try {
      setError('');
      setStep('loading');
      
      const result = await fetchNetEaseRoles(cookies, loginToken);

      if (result.success) {
        const rolesList = result.data.roles;
        saveAuthCache(cookies, loginToken, rolesList);
        // 直接调用 onSuccess 并关闭
        onSuccess(cookies, loginToken, rolesList);
        onClose();
      } else {
        setError(result.error || '获取角色列表失败');
        setStep('qrcode');
      }
    } catch (error) {
      setError('获取角色列表失败');
      setStep('qrcode');
    }
  };

  const handleRetry = () => {
    setError('');
    initQRCode();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-400">
            扫码授权
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            关闭
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="text-red-400 text-sm">{error}</div>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
            >
              重试
            </button>
          </div>
        )}

        {step === 'qrcode' && !error && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-2 text-gray-300">
                {status === 'waiting' ? '请使用网易大神扫码' : '请在手机上确认登录'}
              </div>
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <canvas ref={canvasRef} width={200} height={200} className="w-48 h-48" />
                </div>
              )}
              {status === 'confirming' && (
                <div className="mt-2 text-blue-400 animate-pulse">
                  已扫码，请在手机上确认登录
                </div>
              )}
            </div>
            <div className="text-center">
              <button
                onClick={initQRCode}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
              >
                🔄 刷新二维码
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400 mb-4"></div>
            <div className="text-gray-400">加载中...</div>
          </div>
        )}
      </div>
    </div>
  );
}
