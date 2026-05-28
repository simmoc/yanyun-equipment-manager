'use client';

import { useState, useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import type { Character, Plan, Equipment, GraduationResult, EquipmentSlot } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { getGraduationLevel, getGraduationColor } from '@/lib/graduation';

export default function Home() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [graduationResults, setGraduationResults] = useState<GraduationResult[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<'可用' | '全部' | '穿着'>('可用');
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | '全部'>('全部');
  
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

  useEffect(() => {
    const init = async () => {
      try {
        const fp = await getFingerprint();
        setFingerprint(fp);
        await authenticate(fp);
      } catch (error) {
        console.error('初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const authenticate = async (fp: string) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp })
      });
      const data = await response.json();
      if (data.success) {
        await fetchCharacters(fp);
      }
    } catch (error) {
      console.error('认证失败:', error);
    }
  };

  const fetchCharacters = async (fp: string) => {
    try {
      const response = await fetch('/api/characters', {
        headers: { 'x-fingerprint': fp }
      });
      const data = await response.json();
      if (data.success) {
        setCharacters(data.characters);
        if (data.characters.length > 0 && !selectedCharacter) {
          setSelectedCharacter(data.characters[0]);
        }
      }
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  useEffect(() => {
    if (selectedCharacter) {
      fetchPlans(selectedCharacter.id);
      fetchEquipments(selectedCharacter.id);
    }
  }, [selectedCharacter]);

  const fetchPlans = async (characterId: string) => {
    try {
      const response = await fetch(`/api/plans?characterId=${characterId}`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
        if (data.plans.length > 0 && !selectedPlan) {
          setSelectedPlan(data.plans[0]);
        }
      }
    } catch (error) {
      console.error('获取方案失败:', error);
    }
  };

  const fetchEquipments = async (characterId: string) => {
    try {
      const response = await fetch(`/api/equipments?characterId=${characterId}`);
      const data = await response.json();
      if (data.success) {
        setEquipments(data.equipments);
      }
    } catch (error) {
      console.error('获取装备失败:', error);
    }
  };

  useEffect(() => {
    if (selectedCharacter && plans.length > 0) {
      fetchGraduation(selectedCharacter.id);
    }
  }, [selectedCharacter, plans, equipments]);

  const fetchGraduation = async (characterId: string) => {
    try {
      const response = await fetch(`/api/graduation?characterId=${characterId}`);
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
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint
        },
        body: JSON.stringify({ name: newCharacterName })
      });
      const data = await response.json();
      if (data.success) {
        setCharacters([...characters, data.character]);
        setSelectedCharacter(data.character);
        setNewCharacterName('');
        setShowNewCharacterModal(false);
      }
    } catch (error) {
      console.error('创建角色失败:', error);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch('/api/characters', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint
        },
        body: JSON.stringify({ characterId: selectedCharacter.id })
      });
      const data = await response.json();
      if (data.success) {
        const newCharacters = characters.filter(c => c.id !== selectedCharacter.id);
        setCharacters(newCharacters);
        setSelectedCharacter(newCharacters.length > 0 ? newCharacters[0] : null);
      }
    } catch (error) {
      console.error('删除角色失败:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!selectedCharacter) return;
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          ...newPlanData
        })
      });
      const data = await response.json();
      if (data.success) {
        setPlans([...plans, data.plan]);
        setSelectedPlan(data.plan);
        setShowNewPlanModal(false);
      }
    } catch (error) {
      console.error('创建方案失败:', error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch('/api/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      });
      const data = await response.json();
      if (data.success) {
        const newPlans = plans.filter(p => p.id !== selectedPlan.id);
        setPlans(newPlans);
        setSelectedPlan(newPlans.length > 0 ? newPlans[0] : null);
      }
    } catch (error) {
      console.error('删除方案失败:', error);
    }
  };

  const handleCreateEquipment = async () => {
    if (!selectedCharacter || !newEquipmentData.name.trim()) return;
    try {
      const response = await fetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          ...newEquipmentData
        })
      });
      const data = await response.json();
      if (data.success) {
        setEquipments([...equipments, data.equipment]);
        setShowNewEquipmentModal(false);
        setNewEquipmentData({
          slot: EQUIPMENT_SLOTS[0],
          name: '',
          level: 0,
          attributes: [{ name: '', value: 0, is_main: true }],
          isWearing: false,
          suitType: ''
        });
      }
    } catch (error) {
      console.error('创建装备失败:', error);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      const response = await fetch('/api/equipments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId })
      });
      const data = await response.json();
      if (data.success) {
        setEquipments(equipments.filter(e => e.id !== equipmentId));
      }
    } catch (error) {
      console.error('删除装备失败:', error);
    }
  };

  const handleToggleWearing = async (equipment: Equipment) => {
    try {
      const response = await fetch('/api/equipments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: equipment.id,
          updates: { is_wearing: !equipment.is_wearing }
        })
      });
      const data = await response.json();
      if (data.success) {
        setEquipments(equipments.map(e => 
          e.id === equipment.id ? { ...e, is_wearing: !e.is_wearing } : e
        ));
      }
    } catch (error) {
      console.error('更新装备失败:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export', {
        headers: { 'x-fingerprint': fingerprint }
      });
      const data = await response.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
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
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': fingerprint
        },
        body: JSON.stringify({ data })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`导入成功！导入 ${result.imported.characters} 个角色，${result.imported.plans} 个方案，${result.imported.equipments} 件装备`);
        fetchCharacters(fingerprint);
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
              {filteredEquipments.map(equipment => (
                <div
                  key={equipment.id}
                  className={`equipment-card ${equipment.is_wearing ? 'border-green-400' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-400">{equipment.slot}</span>
                    <button
                      onClick={() => handleDeleteEquipment(equipment.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  </div>
                  <h3 className="font-medium mb-2">{equipment.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">等级: {equipment.level}</p>
                  {equipment.suit_type && (
                    <p className="text-sm text-green-400 mb-2">套装: {equipment.suit_type}</p>
                  )}
                  <div className="text-sm text-gray-300">
                    {equipment.attributes?.map((attr, i) => (
                      <p key={i}>{attr.name}: {attr.value}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => handleToggleWearing(equipment)}
                    className={`mt-2 w-full py-1 rounded ${
                      equipment.is_wearing 
                        ? 'bg-green-500 text-gray-900' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {equipment.is_wearing ? '穿着中' : '未穿着'}
                  </button>
                </div>
              ))}
              
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
                      onChange={(e) => {
                        fetch('/api/plans', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: selectedPlan.id, updates: { flow_type: e.target.value } })
                        });
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
                      onChange={(e) => {
                        fetch('/api/plans', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: selectedPlan.id, updates: { version: e.target.value } })
                        });
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
                      onChange={(e) => {
                        fetch('/api/plans', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: selectedPlan.id, updates: { bow_type: e.target.value } })
                        });
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
                      onChange={(e) => {
                        fetch('/api/plans', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: selectedPlan.id, updates: { suit_type: e.target.value } })
                        });
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
                      onChange={(e) => {
                        fetch('/api/plans', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ planId: selectedPlan.id, updates: { loan_dingyin: e.target.checked } })
                        });
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

      {/* Modals */}
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
              <select value={newEquipmentData.slot} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, slot: e.target.value as any })} className="w-full">
                {EQUIPMENT_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="装备名称" value={newEquipmentData.name} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, name: e.target.value })} className="w-full" />
              <input type="number" placeholder="装备等级" value={newEquipmentData.level} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, level: parseInt(e.target.value) || 0 })} className="w-full" />
              <select value={newEquipmentData.suitType} onChange={(e) => setNewEquipmentData({ ...newEquipmentData, suitType: e.target.value as any })} className="w-full">
                <option value="">无套装</option>
                {SUIT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">装备属性</label>
                {newEquipmentData.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" placeholder="属性名" value={attr.name} onChange={(e) => { const attrs = [...newEquipmentData.attributes]; attrs[i].name = e.target.value; setNewEquipmentData({ ...newEquipmentData, attributes: attrs }); }} className="flex-1" />
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