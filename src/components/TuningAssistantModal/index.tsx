'use client';

import React from 'react';
import { ModalOverlay, ModalProps } from '@/components/Modal';
import { TuningAssistantReport } from '@/components/TuningAssistantReport';
import type { Equipment, Plan, RolePanelData } from '@/types';

interface TuningAssistantModalProps extends ModalProps {
  equipments: Equipment[];
  plan: Plan | null;
  rolePanelData: RolePanelData | null;
  xinfaNameMap: Record<string, string>;
}

export function TuningAssistantModal({
  isOpen,
  onClose,
  equipments,
  plan,
  rolePanelData,
  xinfaNameMap,
}: TuningAssistantModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="bg-gray-800 rounded-lg modal-enter max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700/70 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-purple-300">调号建议</h2>
            <p className="text-sm text-gray-400">基于当前装备、角色面板和所选方案生成。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            关闭
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <TuningAssistantReport
            equipments={equipments}
            plan={plan}
            rolePanelData={rolePanelData}
            xinfaNameMap={xinfaNameMap}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
