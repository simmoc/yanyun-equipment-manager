'use client';

import React from 'react';
import type { GameRole, Character } from '@/types';

interface SelectRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: GameRole[];
  characters: Character[];
  onSelect: (roleId: string) => void;
  isLoading: boolean;
}

export function SelectRoleModal({ isOpen, onClose, roles, characters, onSelect, isLoading }: SelectRoleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-400">选择游戏角色</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            关闭
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">扫码成功，请选择要绑定的游戏角色（后续也可以从上方下拉框选择）</p>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {roles.map((role) => {
            const isAlreadyBound = characters.some(c =>
              c.role_id === role.roleId && c.server === role.server
            );
            return (
              <button
                key={role.roleId}
                onClick={() => onSelect(role.roleId)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition text-left disabled:opacity-50"
              >
                {role.icon && (
                  <img
                    src={role.icon}
                    alt={role.nick}
                    className="w-10 h-10 rounded-full border border-gray-600 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium truncate">{role.nick}</span>
                    {isAlreadyBound && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex-shrink-0">
                        已绑定
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Lv.{role.level} · {role.serverName}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
            角色绑定中...
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-700 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-400 transition"
          >
            稍后选择，也可以从上方下拉框选择角色
          </button>
        </div>
      </div>
    </div>
  );
}
