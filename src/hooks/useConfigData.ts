import { useState, useEffect } from 'react';
import { EQUIPMENT_SLOTS, SUIT_TYPES } from '@/types';
import type { EquipmentSlot, SuitType, XinfaData } from '@/types';
import { ensureConfigData } from '@/lib/configStore';
import type { FlowConfigData, FlowSkillData, FlowRotationAction } from '@/lib/graduationCalculator';

export function useConfigData() {
  const [configData, setConfigData] = useState<{
    equip_data: Record<string, { id: number; name: string; rarity: number; level: number; shortImage: string }>;
    suffix_data: Record<string, { name: string; short: string; icon: string }>;
    affix_data: Record<string, { name: string; need_add: string; unit: string }>;
    slot_data?: Record<string, { id: number; name: string; image: string }>;
    xinfa_data?: Record<string, XinfaData>;
    flow_config?: FlowConfigData;
    flow_rotations?: Record<string, { rotation: FlowRotationAction[] }>;
    flow_skills?: Record<string, Record<string, FlowSkillData>>;
  } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigData(await ensureConfigData());
      } catch (error) {
        console.error('获取配置数据失败:', error);
      }
    };
    fetchConfig();
  }, []);

  const getEquipImageUrl = (name: string): string | null => {
    if (!configData?.equip_data) return null;
    const equip = Object.values(configData.equip_data).find((e: any) => e.name === name);
    if (!equip) return null;
    if (equip.shortImage && equip.shortImage.startsWith('http')) {
      return equip.shortImage;
    }
    return `/img/equip/${equip.id}_short.png`;
  };

  const getEquipNames = (slot?: EquipmentSlot): string[] => {
    if (!configData?.equip_data) return [];
    const names = Object.values(configData.equip_data).map((e: any) => e.name);
    if (!slot) return names;
    return names.filter((name) => getSlotFromEquipName(name) === slot);
  };

  const getAffixNames = (index?: number, affixMode: 'pve' | 'pvp' = 'pve'): string[] => {
    if (!configData?.affix_data) return [];
    const entries = Object.entries(configData.affix_data);
    
    if (typeof index === 'number' && index < 5) {
      return entries
        .filter(([id]) => id.startsWith('1'))
        .map(([_, a]) => a.name)
        .filter((name, idx, self) => self.indexOf(name) === idx)
        .sort();
    }
    
    const dingyinEntries = entries.filter(([id]) => !id.startsWith('1'));
    if (affixMode === 'pve') {
      return dingyinEntries
        .filter(([_, a]) => a.name.includes('增伤'))
        .map(([_, a]) => a.name)
        .filter((name, idx, self) => self.indexOf(name) === idx)
        .sort();
    } else {
      return dingyinEntries
        .filter(([_, a]) => !a.name.includes('增伤'))
        .map(([_, a]) => a.name)
        .filter((name, idx, self) => self.indexOf(name) === idx)
        .sort();
    }
  };

  const getSlotFromEquipName = (name: string): EquipmentSlot => {
    if (!configData?.equip_data) return EQUIPMENT_SLOTS[0];
    const equip = Object.values(configData.equip_data).find((e: any) => e.name === name);
    if (!equip) return EQUIPMENT_SLOTS[0];

    const slotToSuffix: Record<string, string[]> = {
      '剑': ['剑'],
      '枪': ['枪'],
      '环': ['环'],
      '佩': ['佩'],
      '冠胄': ['冠', '胄'],
      '胸甲': ['胸甲'],
      '胫甲': ['胫甲'],
      '腕甲': ['腕甲']
    };

    for (const [slot, suffixes] of Object.entries(slotToSuffix)) {
      if (suffixes.some((s) => name.endsWith(s))) {
        return slot as EquipmentSlot;
      }
    }

    return EQUIPMENT_SLOTS[0];
  };

  const getXinfaInfo = (id: number): XinfaData | null => {
    if (!configData?.xinfa_data) return null;
    return configData.xinfa_data[id] || null;
  };

  return {
    configData,
    getEquipImageUrl,
    getEquipNames,
    getAffixNames,
    getSlotFromEquipName,
    getXinfaInfo
  };
}
