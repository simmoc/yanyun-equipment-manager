import React from 'react';
import { ModalOverlay, ModalProps } from '@/components/Modal';
import { EQUIPMENT_SLOTS, SUIT_TYPES } from '@/types';
import type { Equipment, EquipmentSlot, SuitType, EquipmentAttribute } from '@/types';

type EditEquipmentData = {
  slot: EquipmentSlot;
  name: string;
  level: number;
  attributes: EquipmentAttribute[];
  isWearing: boolean;
  suitType: string;
};

type EditEquipmentModalProps = ModalProps & {
  equipment: Equipment | null;
  equipmentData: EditEquipmentData;
  setEquipmentData: React.Dispatch<React.SetStateAction<EditEquipmentData>>;
  affixMode: 'pve' | 'pvp';
  setAffixMode: React.Dispatch<React.SetStateAction<'pve' | 'pvp'>>;
  getEquipNames: (slot?: EquipmentSlot) => string[];
  getAffixNames: (index?: number) => string[];
  getSlotFromEquipName: (name: string) => EquipmentSlot;
  onSubmit: () => Promise<void>;
};

export function EditEquipmentModal({
  isOpen,
  onClose,
  equipment,
  equipmentData,
  setEquipmentData,
  affixMode,
  setAffixMode,
  getEquipNames,
  getAffixNames,
  getSlotFromEquipName,
  onSubmit
}: EditEquipmentModalProps) {
  if (!isOpen || !equipment) return null;

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">编辑装备</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">部位</label>
              <select
                value={equipmentData.slot}
                onChange={(e) => setEquipmentData({ ...equipmentData, slot: e.target.value as EquipmentSlot })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {EQUIPMENT_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">装备名称</label>
              <select
                value={equipmentData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEquipmentData({
                    ...equipmentData,
                    name,
                    slot: getSlotFromEquipName(name)
                  });
                }}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">选择装备</option>
                {getEquipNames(equipmentData.slot).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">等级</label>
              <input
                type="number"
                value={equipmentData.level}
                onChange={(e) => setEquipmentData({ ...equipmentData, level: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">套装</label>
              <select
                value={equipmentData.suitType}
                onChange={(e) => setEquipmentData({ ...equipmentData, suitType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">无</option>
                {SUIT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isWearingEdit"
              checked={equipmentData.isWearing}
              onChange={(e) => setEquipmentData({ ...equipmentData, isWearing: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isWearingEdit" className="text-gray-400">已装备</label>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">属性</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAffixMode('pve')}
                  className={`px-3 py-1 rounded text-sm ${affixMode === 'pve' ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  PVE定音
                </button>
                <button
                  onClick={() => setAffixMode('pvp')}
                  className={`px-3 py-1 rounded text-sm ${affixMode === 'pvp' ? 'bg-red-600' : 'bg-gray-700'}`}
                >
                  PVP定音
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {equipmentData.attributes.map((attr, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    {index < 5 && <span className="text-xs text-gray-500 block mb-1">基础属性 {index + 1}</span>}
                    {index >= 5 && <span className="text-xs text-gray-500 block mb-1">定音属性 {index - 4}</span>}
                    <select
                      value={attr.name}
                      onChange={(e) => {
                        const newAttrs = [...equipmentData.attributes];
                        newAttrs[index] = { ...newAttrs[index], name: e.target.value };
                        setEquipmentData({ ...equipmentData, attributes: newAttrs });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">选择属性</option>
                      {getAffixNames(index).map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  {index < 5 && (
                    <input
                      type="number"
                      placeholder="数值"
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...equipmentData.attributes];
                        newAttrs[index] = { ...newAttrs[index], value: parseInt(e.target.value) || 0 };
                        setEquipmentData({ ...equipmentData, attributes: newAttrs });
                      }}
                      className="w-24 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  {index >= 5 && (
                    <input
                      type="number"
                      placeholder="数值"
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...equipmentData.attributes];
                        newAttrs[index] = { ...newAttrs[index], value: parseInt(e.target.value) || 0 };
                        setEquipmentData({ ...equipmentData, attributes: newAttrs });
                      }}
                      className="w-24 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  <button
                    onClick={() => {
                      const newAttrs = equipmentData.attributes.filter((_, i) => i !== index);
                      setEquipmentData({
                        ...equipmentData,
                        attributes: newAttrs.length ? newAttrs : [{ name: '', value: 0, is_main: true }]
                      });
                    }}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEquipmentData({
                ...equipmentData,
                attributes: [...equipmentData.attributes, { name: '', value: 0, is_main: false }]
              })}
              className="mt-3 w-full py-2 bg-gray-700 rounded-lg text-gray-400 hover:bg-gray-600"
            >
              + 添加属性
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSubmit}
              className="flex-1 py-2 bg-emerald-500 text-gray-900 rounded-lg btn-hover"
            >
              保存
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