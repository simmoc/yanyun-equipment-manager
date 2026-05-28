'use client';

import { useState, useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import type { Character, Plan, Equipment, GraduationResult, EquipmentSlot, FlowType, VersionType, BowType, SuitType } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { getGraduationLevel, getGraduationColor } from '@/lib/graduation';
import { initLocalDatabase, exportLocalData, importLocalData } from '@/lib/localStore';
import { initDataSource, getDataSource, isLocalMode } from '@/lib/dataSource';

export default function Home() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [graduationResults, setGraduationResults] = useState<GraduationResult[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<'可用' | '全部' | '穿着'>('可用');
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | '全部'>('全部');
  const [configData, setConfigData] = useState<{
    equip_data: Record<string, { id: number; name: string; longImage: string; shortImage: string; rarity: number; level: number }>;
    suffix_data: Record<string, { name: string; short: string; icon: string }>;
    affix_data: Record<string, { name: string; need_add: string; unit: string }>;
  } | null>(null);

  const [showNewCharacterModal, setShowNewCharacterModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [newCharacterName, setNewCharacterName] = useState('');
  const [newPlanData, setNewPlanData] = useState({
    name: '默认方案',
    flowType: FLOW_TYPES[0],
    version: VERSIONS[0],
    flowCategory: FLOW_CATEGORIES[1],
    bowType: BOW_TYPES[0],
    suitType: SUIT_TYPES[0],
    loanDingyin: false
  });
  const [newEquipmentData, setNewEquipmentData] = useState({
    slot: EQUIPMENT_SLOTS[0],
    name: '',
    level: 0,
    attributes: [{ name: '', value: 0, is_main: true }],
    isWearing: false,
    suitType: ''
  });
  const [affixMode, setAffixMode] = useState<'pve' | 'pvp'>('pve');

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getFingerprint();
        setFingerprint(fp);

        const statusResponse = await fetch('/api/status');
        const statusData = await statusResponse.json();
        const dbAvailable = statusData.data?.databaseAvailable;

        if (dbAvailable) {
          initDataSource(fp, false);
          await fetchCharacters();
        } else {
          await initLocalDatabase();
          initDataSource(fp, true);
          setIsLocal(true);
          await initLocalAuth(fp);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        await initLocalDatabase();
        initDataSource('', true);
        setIsLocal(true);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.success) {
          setConfigData(data.data);
        }
      } catch (error) {
        console.error('获取配置数据失败:', error);
      }
    };
    fetchConfig();
  }, []);

  const getEquipNames = (slot?: string) => {
    if (!configData?.equip_data) return [];
    const all = Object.values(configData.equip_data);
    if (!slot || slot === '全部') {
      return all.map(e => e.name).filter((name, index, self) => self.indexOf(name) === index).sort();
    }
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
    const suffixes = slotToSuffix[slot] || [];
    return all.filter(e => suffixes.some(s => e.name.endsWith(s))).map(e => e.name).filter((name, index, self) => self.indexOf(name) === index).sort();
  };

  const getSuitNames = () => {
    if (!configData?.suffix_data) return [];
    return Object.values(configData.suffix_data).map(s => s.name).filter((name, index, self) => self.indexOf(name) === index).sort();
  };

  const getAffixNames = () => {
    if (!configData?.affix_data) return [];
    const entries = Object.entries(configData.affix_data);
    const pvePrefixes = ['24'];
    const pvpPrefixes = ['23'];
    if (affixMode === 'pve') {
      return entries.filter(([id]) => pvePrefixes.some(p => id.startsWith(p))).map(([, a]) => a.name).filter((name, index, self) => self.indexOf(name) === index).sort();
    } else {
      return entries.filter(([id]) => pvpPrefixes.some(p => id.startsWith(p))).map(([, a]) => a.name).filter((name, index, self) => self.indexOf(name) === index).sort();
    }
  };

  const getSlotFromEquipName = (name: string) => {
    if (!configData?.equip_data) return EQUIPMENT_SLOTS[0];
    const equip = Object.values(configData.equip_data).find(e => e.name === name);
    if (!equip) return EQUIPMENT_SLOTS[0];
    const level = equip.level;
    if (level <= 30) return '剑';
    if (level <= 60) return '枪';
    if (level <= 90) return '环';
    return '佩';
  };

  const initLocalAuth = async (fp: string) => {
    const { getUserByFingerprintLocal, createUserLocal, updateUserLoginLocal, getCharactersByUserIdLocal } = await import('@/lib/localStore');
    try {
      let user = await getUserByFingerprintLocal(fp);
      if (user) {
        await updateUserLoginLocal(fp);
      } else {
        user = await createUserLocal(fp);
      }
      setLocalUserId(user.id);
      const chars = await getCharactersByUserIdLocal(user.id);
      setCharacters(chars);
      if (chars.length > 0) {
        setSelectedCharacter(chars[0]);
      }
    } catch (error) {
      console.error('本地认证失败:', error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const ds = getDataSource();
      const chars = await ds.getCharacters('', fingerprint);
      setCharacters(chars);
      if (chars.length > 0 && !selectedCharacter) {
        setSelectedCharacter(chars[0]);
      }
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  useEffect(() => {
    if (selectedCharacter) {
      fetchPlansAndEquipments();
    }
  }, [selectedCharacter]);

  const fetchPlansAndEquipments = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      const [plansData, equipData] = await Promise.all([
        ds.getPlans(selectedCharacter.id),
        ds.getEquipments(selectedCharacter.id)
      ]);
      setPlans(plansData);
      setEquipments(equipData);
      if (plansData.length > 0 && !selectedPlan) {
        setSelectedPlan(plansData[0]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  useEffect(() => {
    if (selectedCharacter && plans.length > 0) {
      fetchGraduation();
    }
  }, [selectedCharacter, plans, equipments]);

  const fetchGraduation = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch(`/api/graduation?characterId=${selectedCharacter.id}`);
      const data = await response.json();
      if (data.success) {
        setGraduationResults(data.results);
      }
    } catch (error) {
      console.error('计算毕业率失败:', error);
    }
  };

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) return;
    try {
      const ds = getDataSource();
      const character = await ds.createCharacter(localUserId || '', fingerprint, newCharacterName.trim());
      setCharacters([...characters, character]);
      setSelectedCharacter(character);
      setNewCharacterName('');
      setShowNewCharacterModal(false);
    } catch (error) {
      console.error('创建角色失败:', error);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      await ds.deleteCharacter(selectedCharacter.id);
      const newCharacters = characters.filter(c => c.id !== selectedCharacter.id);
      setCharacters(newCharacters);
      setSelectedCharacter(newCharacters.length > 0 ? newCharacters[0] : null);
    } catch (error) {
      console.error('删除角色失败:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      const plan = await ds.createPlan(selectedCharacter.id, {
        name: newPlanData.name,
        flow_type: newPlanData.flowType,
        version: newPlanData.version,
        flow_category: newPlanData.flowCategory,
        bow_type: newPlanData.bowType,
        suit_type: newPlanData.suitType,
        loan_dingyin: newPlanData.loanDingyin
      });
      setPlans([...plans, plan]);
      setSelectedPlan(plan);
      setShowNewPlanModal(false);
    } catch (error) {
      console.error('创建方案失败:', error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      const ds = getDataSource();
      await ds.deletePlan(selectedPlan.id);
      const newPlans = plans.filter(p => p.id !== selectedPlan.id);
      setPlans(newPlans);
      setSelectedPlan(newPlans.length > 0 ? newPlans[0] : null);
    } catch (error) {
      console.error('删除方案失败:', error);
    }
  };

  const handleCreateEquipment = async () => {
    if (!selectedCharacter || !newEquipmentData.name.trim()) return;
    try {
      const ds = getDataSource();
      const equipment = await ds.createEquipment(selectedCharacter.id, {
        slot: newEquipmentData.slot,
        name: newEquipmentData.name,
        level: newEquipmentData.level,
        attributes: newEquipmentData.attributes,
        is_wearing: newEquipmentData.isWearing,
        suit_type: (newEquipmentData.suitType || undefined) as SuitType | undefined
      });
      setEquipments([...equipments, equipment]);
      setShowNewEquipmentModal(false);
      setNewEquipmentData({
        slot: EQUIPMENT_SLOTS[0],
        name: '',
        level: 0,
        attributes: [{ name: '', value: 0, is_main: true }],
        isWearing: false,
        suitType: ''
      });
    } catch (error) {
      console.error('创建装备失败:', error);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      const ds = getDataSource();
      await ds.deleteEquipment(equipmentId);
      setEquipments(equipments.filter(e => e.id !== equipmentId));
    } catch (error) {
      console.error('删除装备失败:', error);
    }
  };

  const handleToggleWearing = async (equipment: Equipment) => {
    try {
      const ds = getDataSource();
      await ds.updateEquipment(equipment.id, { is_wearing: !equipment.is_wearing });
      setEquipments(equipments.map(e =>
        e.id === equipment.id ? { ...e, is_wearing: !e.is_wearing } : e
      ));
    } catch (error) {
      console.error('更新装备失败:', error);
    }
  };

  const handleExport = async () => {
    try {
      if (isLocal) {
        const localData = exportLocalData();
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yanyun-local-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const ds = getDataSource();
        const data = await ds.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yanyun-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (isLocal) {
        importLocalData(data as Parameters<typeof importLocalData>[0]);
        if (localUserId) {
          const { getCharactersByUserIdLocal } = await import('@/lib/localStore');
          const chars = await getCharactersByUserIdLocal(localUserId);
          setCharacters(chars);
          setSelectedCharacter(chars.length > 0 ? chars[0] : null);
        }
        alert('导入成功！');
      } else {
        const ds = getDataSource();
        await ds.importData(data);
        alert('导入成功！');
        await fetchCharacters();
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请检查文件格式');
    }
  };

  const filteredEquipments = equipments.filter(e => {
    if (equipmentFilter === '可用' && !e.is_wearing) return false;
    if (equipmentFilter === '穿着' && !e.is_wearing) return false;
    if (slotFilter !== '全部' && e.slot !== slotFilter) return false;
    return true;
  });

  const currentGraduation = graduationResults.find(r => r.plan_id === selectedPlan?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400 mb-4"></div>
          <p className="text-gray-400">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-green-400">
          燕云十六声装备毕业率管理器
        </h1>
        <button
          onClick={() => setShowAboutModal(true)}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
        >
          关于本网站
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6 bg-gray-800/50 p-4 rounded-lg">
        <select
          value={selectedCharacter?.id || ''}
          onChange={(e) => {
            const char = characters.find(c => c.id === e.target.value);
            setSelectedCharacter(char || null);
            setSelectedPlan(null);
          }}
          className="min-w-[200px]"
        >
          <option value="" disabled>-- 请选择/添加角色 --</option>
          {characters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowNewCharacterModal(true)}
          className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg btn-hover font-medium"
        >
          + 新建角色
        </button>

        {selectedCharacter && (
          <button
            onClick={handleDeleteCharacter}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
          >
            删除
          </button>
        )}

        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
        >
          导出/导入数据
        </button>
      </div>

      {selectedCharacter ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {['可用', '全部', '穿着'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setEquipmentFilter(filter as any)}
                  className={`tab-button ${equipmentFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}

              {EQUIPMENT_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSlotFilter(slot)}
                  className={`tab-button ${slotFilter === slot ? 'active' : ''}`}
                >
                  {slot}
                </button>
              ))}

              <button
                onClick={() => setSlotFilter('全部')}
                className={`tab-button ${slotFilter === '全部' ? 'active' : ''}`}
              >
                全部
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {filteredEquipments.map(equipment => {
                const equipImage = configData?.equip_data ? Object.values(configData.equip_data).find(e => e.name === equipment.name)?.shortImage : null;
                const suitInfo = configData?.suffix_data ? Object.values(configData.suffix_data).find(s => s.name === equipment.suit_type) : null;
                const mainAttrs = equipment.attributes?.filter(a => a.is_main) || [];
                const subAttrs = equipment.attributes?.filter(a => !a.is_main) || [];
                return (
                  <div
                    key={equipment.id}
                    className={`equipment-card ${equipment.is_wearing ? 'border-green-400' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">{equipment.slot}</span>
                      <button
                        onClick={() => handleDeleteEquipment(equipment.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ×
                      </button>
                    </div>
                    {equipImage && (
                      <div className="relative w-full h-24 mb-2 flex items-center justify-center bg-gray-900/50 rounded overflow-hidden">
                        <img src={equipImage} alt={equipment.name} className="max-h-full max-w-full object-contain" />
                        {equipment.is_wearing && (
                          <span className="absolute top-1 right-1 text-xs px-1.5 py-0.5 bg-green-500 text-gray-900 rounded">穿着中</span>
                        )}
                      </div>
                    )}
                    <h3 className="font-medium text-sm mb-1 truncate">{equipment.name}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>等级: {equipment.level}</span>
                      {suitInfo && (
                        <div className="flex items-center gap-1 text-green-400">
                          <img src={suitInfo.icon} alt={suitInfo.name} className="w-4 h-4 object-contain" />
                          <span className="truncate max-w-[60px]">{suitInfo.name}</span>
                        </div>
                      )}
                    </div>
                    {equipment.suit_type && !suitInfo && (
                      <p className="text-xs text-green-400 mb-2">套装: {equipment.suit_type}</p>
                    )}
                    <div className="space-y-1">
                      {mainAttrs.length > 0 && (
                        <div className="text-xs">
                          {mainAttrs.map((attr, i) => (
                            <div key={i} className="flex justify-between text-gray-300">
                              <span className="truncate">{attr.name}</span>
                              <span className="text-green-400 ml-1">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {subAttrs.length > 0 && (
                        <div className="text-xs border-t border-gray-700 pt-1 mt-1">
                          {subAttrs.slice(0, 3).map((attr, i) => (
                            <div key={i} className="flex justify-between text-gray-400">
                              <span className="truncate">{attr.name}</span>
                              <span className="text-blue-400 ml-1">{attr.value}</span>
                            </div>
                          ))}
                          {subAttrs.length > 3 && (
                            <div className="text-gray-500 text-center">+{subAttrs.length - 3}更多</div>
                          )}
                        </div>
                      )}
                    </div>
                    {!equipImage && (
                      <button
                        onClick={() => handleToggleWearing(equipment)}
                        className={`mt-2 w-full py-1 rounded text-xs ${
                          equipment.is_wearing
                            ? 'bg-green-500 text-gray-900'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {equipment.is_wearing ? '穿着中' : '未穿着'}
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setShowNewEquipmentModal(true)}
                className="equipment-card flex items-center justify-center text-green-400 hover:border-green-400"
              >
                <span className="text-xl">+ 录入装备</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-green-400">面板</h2>

            <div className="mb-4">
              <select
                value={selectedPlan?.id || ''}
                onChange={(e) => {
                  const plan = plans.find(p => p.id === e.target.value);
                  setSelectedPlan(plan || null);
                }}
                className="w-full"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedPlan && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">流派</label>
                    <select
                      value={selectedPlan.flow_type}
                      onChange={async (e) => {
                        try {
                          const ds = getDataSource();
                          await ds.updatePlan(selectedPlan.id, { flow_type: e.target.value as FlowType });
                        } catch (error) {
                          console.error('更新流派失败:', error);
                        }
                      }}
                      className="w-full"
                    >
                      {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">版本</label>
                    <select
                      value={selectedPlan.version}
                      onChange={async (e) => {
                        try {
                          const ds = getDataSource();
                          await ds.updatePlan(selectedPlan.id, { version: e.target.value as VersionType });
                        } catch (error) {
                          console.error('更新版本失败:', error);
                        }
                      }}
                      className="w-full"
                    >
                      {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">弓诀</label>
                    <select
                      value={selectedPlan.bow_type}
                      onChange={async (e) => {
                        try {
                          const ds = getDataSource();
                          await ds.updatePlan(selectedPlan.id, { bow_type: e.target.value as BowType });
                        } catch (error) {
                          console.error('更新弓诀失败:', error);
                        }
                      }}
                      className="w-full"
                    >
                      {BOW_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">套装</label>
                    <select
                      value={selectedPlan.suit_type}
                      onChange={async (e) => {
                        try {
                          const ds = getDataSource();
                          await ds.updatePlan(selectedPlan.id, { suit_type: e.target.value as SuitType });
                        } catch (error) {
                          console.error('更新套装失败:', error);
                        }
                      }}
                      className="w-full"
                    >
                      {SUIT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPlan.loan_dingyin}
                      onChange={async (e) => {
                        try {
                          const ds = getDataSource();
                          await ds.updatePlan(selectedPlan.id, { loan_dingyin: e.target.checked });
                        } catch (error) {
                          console.error('更新贷款定音失败:', error);
                        }
                      }}
                    />
                    <label className="text-sm">贷款定音</label>
                  </div>
                </div>

                {currentGraduation && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">毕业率</h3>

                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span>总体毕业率</span>
                        <span style={{ color: getGraduationColor(currentGraduation.overall_rate) }}>
                          {currentGraduation.overall_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar h-4">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${currentGraduation.overall_rate}%`,
                            background: getGraduationColor(currentGraduation.overall_rate)
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {getGraduationLevel(currentGraduation.overall_rate)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(currentGraduation.slot_rates).map(([slot, rate]) => (
                        <div key={slot}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{slot}</span>
                            <span style={{ color: getGraduationColor(rate) }}>
                              {rate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="progress-bar h-2">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${rate}%`,
                                background: getGraduationColor(rate)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentGraduation.recommendations.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-700/50 rounded">
                        <h4 className="text-sm font-medium mb-2 text-yellow-400">优化建议</h4>
                        {currentGraduation.recommendations.map((rec, i) => (
                          <p key={i} className="text-sm text-gray-300">{rec}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleDeletePlan}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    删除方案
                  </button>
                  <button
                    onClick={() => setShowNewPlanModal(true)}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                  >
                    + 新增
                  </button>
                </div>
              </>
            )}

            {!selectedPlan && plans.length === 0 && (
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="w-full py-2 bg-green-500 text-gray-900 rounded-lg btn-hover"
              >
                + 创建方案
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-400 mb-4">欢迎使用燕云十六声装备毕业率管理器</h2>
          <p className="text-gray-500 mb-6">请先创建一个角色开始使用</p>
          <button
            onClick={() => setShowNewCharacterModal(true)}
            className="px-6 py-3 bg-green-500 text-gray-900 rounded-lg btn-hover font-medium"
          >
            + 新建角色
          </button>
        </div>
      )}

      {showNewCharacterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">新建角色</h2>
            <input
              type="text"
              placeholder="请输入新角色名称"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              className="w-full mb-4"
              autoFocus
            />
            <div className="flex gap-4">
              <button onClick={() => setShowNewCharacterModal(false)} className="px-4 py-2 bg-gray-700 rounded-lg">取消</button>
              <button onClick={handleCreateCharacter} className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg btn-hover">确认创建</button>
            </div>
          </div>
        </div>
      )}

      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">新建方案</h2>
            <div className="space-y-4">
              <input type="text" placeholder="方案名称" value={newPlanData.name} onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })} className="w-full" />
              <select value={newPlanData.flowType} onChange={(e) => setNewPlanData({ ...newPlanData, flowType: e.target.value as any })} className="w-full">
                {FLOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={newPlanData.suitType} onChange={(e) => setNewPlanData({ ...newPlanData, suitType: e.target.value as any })} className="w-full">
                {SUIT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setShowNewPlanModal(false)} className="px-4 py-2 bg-gray-700 rounded-lg">取消</button>
              <button onClick={handleCreatePlan} className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg btn-hover">确认创建</button>
            </div>
          </div>
        </div>
      )}

      {showNewEquipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">录入装备</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">部位</label>
                  <select value={newEquipmentData.slot} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, slot: e.target.value as EquipmentSlot, name: '' })} className="w-full">
                    {EQUIPMENT_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">等级</label>
                  <input type="number" placeholder="等级" value={newEquipmentData.level} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, level: parseInt(e.target.value) || 0 })} className="w-full" />
                </div>
              </div>
              <select value={newEquipmentData.name} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, name: e.target.value })} className="w-full">
                <option value="">-- 选择装备 --</option>
                {getEquipNames(newEquipmentData.slot).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <select value={newEquipmentData.suitType} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, suitType: e.target.value })} className="w-full">
                <option value="">无套装</option>
                {getSuitNames().map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">装备属性</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setAffixMode('pve'); setNewEquipmentData({ ...newEquipmentData, attributes: [{ name: '', value: 0, is_main: true }] }); }} className={`text-xs px-2 py-1 rounded ${affixMode === 'pve' ? 'bg-green-500 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>PVE定音</button>
                    <button type="button" onClick={() => { setAffixMode('pvp'); setNewEquipmentData({ ...newEquipmentData, attributes: [{ name: '', value: 0, is_main: true }] }); }} className={`text-xs px-2 py-1 rounded ${affixMode === 'pvp' ? 'bg-red-500 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>PVP定音</button>
                  </div>
                </div>
                {newEquipmentData.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select value={attr.name} onChange={(e) => { const attrs = [...newEquipmentData.attributes]; attrs[i].name = e.target.value; setNewEquipmentData({ ...newEquipmentData, attributes: attrs }); }} className="flex-1">
                      <option value="">-- 选择属性 --</option>
                      {getAffixNames().map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <input type="number" placeholder="数值" value={attr.value} onChange={(e) => { const attrs = [...newEquipmentData.attributes]; attrs[i].value = parseInt(e.target.value) || 0; setNewEquipmentData({ ...newEquipmentData, attributes: attrs }); }} className="w-20" />
                    <button onClick={() => { const attrs = newEquipmentData.attributes.filter((_, j) => j !== i); setNewEquipmentData({ ...newEquipmentData, attributes: attrs.length ? attrs : [{ name: '', value: 0, is_main: true }] }); }} className="px-2 bg-red-500/20 text-red-400 rounded">×</button>
                  </div>
                ))}
                <button onClick={() => setNewEquipmentData({ ...newEquipmentData, attributes: [...newEquipmentData.attributes, { name: '', value: 0, is_main: false }] })} className="text-sm text-green-400">+ 添加属性</button>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={newEquipmentData.isWearing} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, isWearing: e.target.checked })} />
                <label className="text-sm">当前穿着</label>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setShowNewEquipmentModal(false)} className="px-4 py-2 bg-gray-700 rounded-lg">取消</button>
              <button onClick={handleCreateEquipment} className="px-4 py-2 bg-green-500 text-gray-900 rounded-lg btn-hover">确认录入</button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">导出/导入数据</h2>
            <div className="space-y-4">
              <button onClick={handleExport} className="w-full py-3 bg-green-500 text-gray-900 rounded-lg btn-hover">导出数据</button>
              <label className="block w-full py-3 bg-blue-500/20 text-blue-400 rounded-lg text-center cursor-pointer hover:bg-blue-500/30">
                导入数据
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
            <button onClick={() => setShowExportModal(false)} className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg">关闭</button>
          </div>
        </div>
      )}

      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">关于本网站</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg text-green-400">燕云十六声装备毕业率管理器</h3>
              <p>欢迎使用本在线工具。这是一个专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台。</p>
              <h4 className="font-medium text-white">功能特点：</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>浏览器指纹自动登录，无需注册账号</li>
                <li>多角色管理，支持创建多个游戏角色</li>
                <li>装备管理，按部位分类管理所有装备</li>
                <li>流派方案，支持10种流派配置</li>
                <li>毕业率计算，实时计算装备毕业进度</li>
                <li>数据导入导出，支持数据备份和迁移</li>
              </ul>
              <h4 className="font-medium text-white">技术架构：</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>前端：Next.js + React + TailwindCSS</li>
                <li>后端：Vercel Edge Functions</li>
                <li>数据库：Neon PostgreSQL</li>
                <li>认证：FingerprintJS 浏览器指纹</li>
              </ul>
            </div>
            <button onClick={() => setShowAboutModal(false)} className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
