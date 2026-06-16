import React from 'react';
import { ModalOverlay, ModalProps } from '@/components/Modal';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, BOW_TYPES, SUIT_TYPES } from '@/types';
import type { FlowType, VersionType, BowType, SuitType, FlowCategory } from '@/types';

type NewPlanData = {
  name: string;
  flowType: FlowType;
  version: VersionType;
  flowCategory: FlowCategory;
  bowType: BowType;
  suitType: SuitType;
  loanDingyin: boolean;
};

type NewPlanModalProps = ModalProps & {
  planData: NewPlanData;
  setPlanData: React.Dispatch<React.SetStateAction<NewPlanData>>;
  onSubmit: () => Promise<void>;
};

export function NewPlanModal({
  isOpen,
  onClose,
  planData,
  setPlanData,
  onSubmit
}: NewPlanModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">新建方案</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">方案名称</label>
            <input
              type="text"
              value={planData.name}
              onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">流派</label>
            <select
              value={planData.flowType}
              onChange={(e) => setPlanData({ ...planData, flowType: e.target.value as FlowType })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FLOW_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">版本</label>
            <select
              value={planData.version}
              onChange={(e) => setPlanData({ ...planData, version: e.target.value as VersionType })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {VERSIONS.map((version) => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">场景</label>
            <select
              value={planData.flowCategory}
              onChange={(e) => setPlanData({ ...planData, flowCategory: e.target.value as FlowCategory })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {FLOW_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">弓类型</label>
            <select
              value={planData.bowType}
              onChange={(e) => setPlanData({ ...planData, bowType: e.target.value as BowType })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {BOW_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">套装</label>
            <select
              value={planData.suitType}
              onChange={(e) => setPlanData({ ...planData, suitType: e.target.value as SuitType })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SUIT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="loanDingyin"
              checked={planData.loanDingyin}
              onChange={(e) => setPlanData({ ...planData, loanDingyin: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="loanDingyin" className="text-gray-400">使用借用钉音</label>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onSubmit}
              className="flex-1 py-2 bg-emerald-500 text-gray-900 rounded-lg btn-hover"
            >
              创建
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 rounded-lg"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}