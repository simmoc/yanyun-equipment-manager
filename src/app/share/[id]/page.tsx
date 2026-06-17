'use client';

import { useState, useEffect } from 'react';
import type { Equipment, EquipmentSlot, SharedCharacterData } from '@/types';

type ConfigData = {
  equip_data: Record<string, { id: number; name: string; shortImage?: string }>;
  suffix_data: Record<string, { name: string; short: string; icon: string }>;
  affix_data: Record<string, { name: string; need_add: string; unit: string }>;
};

const BUILT_IN_ATTRIBUTES = [
  'HP_MAX', 'W_DEF', 'ARCHER_DAMAGE', 'ARCHER_WEAKPOINT_DAMAGE'
];

const QUALITY_COLORS: Record<number, string> = {
  1: 'text-gray-400 bg-gray-600/30',
  2: 'text-blue-400 bg-blue-600/30',
  3: 'text-purple-400 bg-purple-600/30',
  4: 'text-orange-400 bg-orange-600/30',
  5: 'text-red-400 bg-red-600/30'
};

const SLOT_NAME_MAP: Record<string, string> = {
  '主武器': '武器', '副武器': '武器', '环': '环', '佩': '佩',
  '冠胄': '冠胄', '胸甲': '胸甲', '胫甲': '胫甲', '腕甲': '腕甲', '射决': '射决', '弓': '弓'
};

function formatValue(value: number, _attrName: string): string {
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function getEquipImageUrlFromConfig(configData: ConfigData | null, name: string): string | null {
  if (!configData?.equip_data) return null;
  const equip = Object.values(configData.equip_data).find((e: any) => e.name === name);
  if (!equip) return null;
  if (equip.shortImage && equip.shortImage.startsWith('http')) {
    return equip.shortImage;
  }
  return `/img/equip/${equip.id}_short.png`;
}

export default function SharePage({ params }: { params: { id: string } }) {
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [snapshot, setSnapshot] = useState<SharedCharacterData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const configRes = await fetch('/api/config');
        const configResult = await configRes.json();
        if (configResult.success) {
          setConfigData(configResult.data);
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const fetchShare = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/share/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSnapshot(data.snapshot as SharedCharacterData);
            setLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const { getShareLocal } = await import('@/lib/localStore');
        const share = await getShareLocal(params.id);
        if (share) {
          setSnapshot(share.snapshot as SharedCharacterData);
          setLoading(false);
          return;
        }
      } catch {}

      setError('分享不存在或已过期');
      setLoading(false);
    };

    fetchShare();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl text-gray-400 mb-2">分享不存在</h1>
          <p className="text-gray-500">{error || '该角色分享链接可能已过期或已被删除'}</p>
          <a href="/" className="inline-block mt-4 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm">
            前往燕云装备管理器
          </a>
        </div>
      </div>
    );
  }

  const { character, equipments, rolePanelData } = snapshot;

  return (
    <div className="min-h-screen bg-gray-900 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-green-400">燕云十六声角色分享</h1>
            <p className="text-gray-500 text-sm mt-1">{new Date(snapshot.createdAt).toLocaleString('zh-CN')}</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm"
          >
            前往燕云装备管理器
          </a>
        </header>

        {/* Character Info */}
        <div className="bg-gray-800/50 p-4 rounded-lg mb-6 flex items-center gap-4">
          {character.icon && (
            <img src={character.icon} alt={character.name} className="w-14 h-14 rounded-full border-2 border-green-400" />
          )}
          <div>
            <div className="text-lg font-medium text-white">{character.name}</div>
            <div className="text-sm text-gray-400">
              {character.level && `等级 ${character.level}`}
              {character.level && character.server_name && ' · '}
              {character.server_name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold mb-3 text-green-400">装备 ({equipments.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {equipments.map(equipment => {
                const equipImage = getEquipImageUrlFromConfig(configData, equipment.name);
                const suitInfo = configData?.suffix_data
                  ? Object.values(configData.suffix_data).find((s) => s.name === equipment.suit_type)
                  : null;
                const attributes = equipment.attributes || [];
                const builtIn = attributes.filter(attr =>
                  BUILT_IN_ATTRIBUTES.some(b => attr.name.includes(b) || b.includes(attr.name))
                );
                const affixes = attributes.filter(attr =>
                  !BUILT_IN_ATTRIBUTES.some(b => attr.name.includes(b) || b.includes(attr.name))
                );

                return (
                  <div key={equipment.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <div className="p-2 border-b border-gray-700">
                      <div className="flex gap-2">
                        <div className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-none">
                          {equipImage ? (
                            <img src={equipImage} alt={equipment.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-sm">⚔️</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 font-medium text-[12px] truncate leading-tight">{equipment.name}</div>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-gray-500 text-[10px]">{SLOT_NAME_MAP[equipment.slot] || equipment.slot}</span>
                            {equipment.level > 0 && (
                              <span className="px-1 py-[1px] bg-blue-500/20 text-blue-400 text-[9px] rounded">Lv.{equipment.level}</span>
                            )}
                            {equipment.suit_type && (
                              <span className="px-1 py-[1px] bg-amber-500/20 text-amber-400 text-[9px] rounded leading-none">
                                {suitInfo?.short || equipment.suit_type}
                              </span>
                            )}
                            {equipment.is_wearing && (
                              <span className="px-1 py-[1px] bg-emerald-500/20 text-emerald-400 text-[9px] rounded">已装备</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1.5 space-y-1">
                      {builtIn.length > 0 && (
                        <div className="space-y-[1px]">
                          <div className="text-[8px] text-gray-500">基础属性</div>
                          {builtIn.map((attr, i) => (
                            <div key={i} className="flex items-center justify-between px-1 py-0.5 bg-gray-700/30 rounded">
                              <span className="text-gray-300 text-[10px]">{attr.name}</span>
                              <span className="text-green-400 text-[10px] font-medium">{formatValue(attr.value, attr.name)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {affixes.length > 0 && (
                        <div className="space-y-[1px]">
                          <div className="text-[8px] text-gray-500">词条</div>
                          {affixes.map((attr, i) => {
                            const rate = attr.rate || 0;
                            const isMax = attr.is_main;
                            return (
                              <div key={i} className="flex items-center justify-between px-1 py-0.5 bg-gray-700/30 rounded">
                                <span className="text-gray-300 text-[10px] truncate">{attr.name}</span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-green-400 text-[10px] font-medium">{formatValue(attr.value, attr.name)}</span>
                                  {rate > 0 && (
                                    <span className={`text-[6px] leading-none ${isMax ? 'text-yellow-400' : 'text-gray-500'}`}>
                                      {rate.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {builtIn.length === 0 && affixes.length === 0 && (
                        <div className="text-gray-500 text-[10px] text-center py-1">无词条信息</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Panel */}
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <h2 className="text-base font-bold mb-2 text-green-400">角色属性</h2>
            {rolePanelData ? (
              <div className="space-y-2">
                {/* 概率属性 */}
                <div className="bg-gray-700/50 p-2 rounded-lg">
                  <div className="text-sm font-medium mb-1 text-yellow-300">三率属性</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {[
                      ['精准概率', rolePanelData.ACR_PROB, false],
                      ['实际精准', rolePanelData.REAL_ACR_PROB, true],
                      ['会心概率', rolePanelData.CRI_PROB, false],
                      ['实际会心', rolePanelData.REAL_CRI_PROB, true],
                      ['会意概率', rolePanelData.BASH_PROB, false],
                      ['实际会意', rolePanelData.REAL_BASH_PROB, true],
                      ['直接会心', rolePanelData.DIRECT_CRI_PROB, false],
                      ['直接会意', rolePanelData.DIRECT_BASH_PROB, false],
                    ].map(([label, value, highlight]) => (
                      <div key={label as string} className="flex justify-between items-center gap-1">
                        <span className="text-xs text-gray-400">{label as string}</span>
                        <span className={`text-sm font-medium ${highlight ? 'text-green-300' : ''}`}>{value as string}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 攻击属性 */}
                <div className="bg-gray-700/50 p-2 rounded-lg">
                  <div className="text-sm font-medium mb-1 text-green-300">攻击属性</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {[
                      ['最小外功', rolePanelData.MIN_W_ATK],
                      ['最大外功', rolePanelData.MAX_W_ATK],
                      ['最小鸣金', rolePanelData.MIN_PRO_ATK_A],
                      ['最大鸣金', rolePanelData.MAX_PRO_ATK_A],
                      ['最小牵丝', rolePanelData.MIN_PRO_ATK_B],
                      ['最大牵丝', rolePanelData.MAX_PRO_ATK_B],
                      ['最小破竹', rolePanelData.MIN_PRO_ATK_C],
                      ['最大裂石', rolePanelData.MAX_PRO_ATK_C],
                      ['最小破竹', rolePanelData.MIN_PRO_ATK_E],
                      ['最大破竹', rolePanelData.MAX_PRO_ATK_E],
                      ['最小无相', rolePanelData.MIN_ACTIVE_PRO_ATK],
                      ['最大无相', rolePanelData.MAX_ACTIVE_PRO_ATK],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between items-center gap-1">
                        <span className="text-xs text-gray-400">{label as string}</span>
                        <span className="text-sm font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 防御属性 */}
                <div className="bg-gray-700/50 p-2 rounded-lg">
                  <div className="text-sm font-medium mb-1 text-blue-300">防御属性</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {[
                      ['外攻防御', rolePanelData.W_DEF],
                      ['气血最大值', rolePanelData.hpMax],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between items-center gap-1">
                        <span className="text-xs text-gray-400">{label as string}</span>
                        <span className="text-sm font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">暂无角色面板数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
