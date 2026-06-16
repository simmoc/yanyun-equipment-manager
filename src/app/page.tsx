'use client';

import { useState, useEffect } from 'react';
import type { Character, Plan, Equipment, GraduationResult, EquipmentSlot, FlowType, VersionType, BowType, SuitType, EquipmentAttribute, GameRole, RolePanelData } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { getGraduationLevel, getGraduationColor } from '@/lib/graduation';
import { exportLocalData, importLocalData } from '@/lib/localStore';
import { getDataSource } from '@/lib/dataSource';
import { useAppData, useConfigData } from '@/hooks';
import {
  NewEquipmentModal,
  EditEquipmentModal,
  ExportModal,
  AboutModal,
  EquipmentCard,
  TuningAssistantReport,
  QRCodeAuthModal
} from '@/components';

export default function Home() {
  const {
    fingerprint,
    isLoading,
    isLocal,
    localUserId,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    plans,
    selectedPlan,
    setSelectedPlan,
    equipments,
    authCredentials,
    availableGameRoles,
    rolePanelData,
    isLoadingRolePanel,
    fetchCharacters,
    fetchPlansAndEquipments,
    initLocalAuth,
    saveAuthCredentials,
    fetchRolePanel
  } = useAppData();

  const {
    configData,
    getEquipImageUrl,
    getEquipNames,
    getAffixNames: getAffixNamesBase,
    getSlotFromEquipName,
    getXinfaInfo
  } = useConfigData();

  const [graduationResults, setGraduationResults] = useState<GraduationResult[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<'可用' | '全部' | '穿着'>('可用');
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | '全部'>('全部');

  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTuningAssistant, setShowTuningAssistant] = useState(false);
  const [showQRCodeAuth, setShowQRCodeAuth] = useState(false);
  const [tuningCapturedData, setTuningCapturedData] = useState<any>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [newEquipmentData, setNewEquipmentData] = useState({
    slot: EQUIPMENT_SLOTS[0],
    name: '',
    level: 0,
    attributes: [{ name: '', value: 0, is_main: true }],
    isWearing: false,
    suitType: ''
  });
  const [editEquipmentData, setEditEquipmentData] = useState({
    slot: EQUIPMENT_SLOTS[0] as EquipmentSlot,
    name: '',
    level: 0,
    attributes: [] as { name: string; value: number; is_main: boolean }[],
    isWearing: false,
    suitType: ''
  });
  const [affixMode, setAffixMode] = useState<'pve' | 'pvp'>('pve');

  // 游戏角色选择状态
  const [selectedGameRoleId, setSelectedGameRoleId] = useState<string>('');
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);

  useEffect(() => {
    if (selectedCharacter && plans.length > 0) {
      fetchGraduation();
    }
  }, [selectedCharacter, plans, equipments]);

  useEffect(() => {
    if (selectedCharacter) {
      fetchRolePanel(selectedCharacter);
    }
  }, [selectedCharacter]);

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

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      await ds.deleteCharacter(selectedCharacter.id);
    } catch (error) {
      console.error('删除角色失败:', error);
    }
  };

  const handleCreateEquipment = async () => {
    if (!selectedCharacter || !newEquipmentData.name.trim()) return;
    try {
      const ds = getDataSource();
      await ds.createEquipment(selectedCharacter.id, {
        slot: newEquipmentData.slot,
        name: newEquipmentData.name,
        level: newEquipmentData.level,
        attributes: newEquipmentData.attributes,
        is_wearing: newEquipmentData.isWearing,
        suit_type: (newEquipmentData.suitType || undefined) as SuitType | undefined
      });
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
    } catch (error) {
      console.error('删除装备失败:', error);
    }
  };

  const handleToggleWearing = async (equipment: Equipment) => {
    try {
      const ds = getDataSource();
      await ds.updateEquipment(equipment.id, { is_wearing: !equipment.is_wearing });
    } catch (error) {
      console.error('更新装备失败:', error);
    }
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setEditEquipmentData({
      slot: equipment.slot,
      name: equipment.name,
      level: equipment.level,
      attributes: [...equipment.attributes],
      isWearing: equipment.is_wearing,
      suitType: equipment.suit_type || ''
    });
    setShowEditEquipmentModal(true);
  };

  const handleUpdateEquipment = async () => {
    if (!editingEquipment) return;
    try {
      const ds = getDataSource();
      await ds.updateEquipment(editingEquipment.id, {
        slot: editEquipmentData.slot,
        name: editEquipmentData.name,
        level: editEquipmentData.level,
        attributes: editEquipmentData.attributes,
        is_wearing: editEquipmentData.isWearing,
        suit_type: (editEquipmentData.suitType || undefined) as SuitType | undefined
      });
      setShowEditEquipmentModal(false);
      setEditingEquipment(null);
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

  // 扫码登录成功，保存凭证
  const handleQRCodeAuthSuccess = (cookies: any, loginToken: string, roles: GameRole[]) => {
    saveAuthCredentials(cookies, loginToken, roles);
    setShowQRCodeAuth(false);
  };

  // 处理游戏角色选择
  const handleGameRoleSelect = async (gameRoleId: string) => {
    setSelectedGameRoleId(gameRoleId);
    
    if (!gameRoleId || !authCredentials) return;
    
    const gameRole = availableGameRoles.find(r => r.roleId === gameRoleId);
    if (!gameRole) return;
    
    // 检查是否已经创建过这个角色
    const existingCharacter = characters.find(c => c.role_id === gameRoleId && c.server === gameRole.server);
    if (existingCharacter) {
      setSelectedCharacter(existingCharacter);
      setSelectedGameRoleId('');
      // 如果已有角色，尝试读取保存的角色面板数据
      const authDataStr = localStorage.getItem(`auth_${existingCharacter.id}`);
      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        if (authData.rolePanelData) {
          // 这里我们需要调用 useAppData 来更新状态，但我们在这里不能直接调用
          // 所以让 selectedCharacter 的 useEffect 来处理
        }
      }
      return;
    }
    
    // 创建新角色
    setIsCreatingCharacter(true);
    try {
      const ds = getDataSource();
      
      // 获取角色信息（装备等）
      const response = await fetch('/api/auth/role-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roleId: gameRole.roleId,
          server: gameRole.server,
          cookies: authCredentials.cookies,
          loginToken: authCredentials.loginToken
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 创建角色
        const character = await ds.createCharacter(localUserId || '', fingerprint, gameRole.nick, {
          icon: gameRole.icon,
          level: gameRole.level,
          server_name: gameRole.serverName,
          role_id: gameRole.roleId,
          server: gameRole.server
        });
        
        // 获取角色面板数据
        let rolePanelData: any = null;
        try {
          const panelResponse = await fetch('/api/auth/role-panel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              roleId: gameRole.roleId,
              server: gameRole.server,
              cookies: authCredentials.cookies,
              loginToken: authCredentials.loginToken
            })
          });
          
          const panelResult = await panelResponse.json();
          if (panelResult.success && panelResult.data) {
            rolePanelData = panelResult.data;
          }
        } catch (panelError) {
          console.error('获取角色面板数据失败:', panelError);
        }
        
        // 保存认证信息（区分 roleInfo 和 rolePanelData）
        localStorage.setItem(`auth_${character.id}`, JSON.stringify({
          roleId: gameRole.roleId,
          server: gameRole.server,
          cookies: authCredentials.cookies,
          loginToken: authCredentials.loginToken,
          roleInfo: result.data.roleInfo,
          reportToken: result.data.reportToken,
          rolePanelData: rolePanelData
        }));
        
        // 导入装备
        const importedCount = await importRoleInfoEquipments(character.id, result.data.roleInfo);
        
        setSelectedCharacter(character);
        setSelectedGameRoleId('');
        await fetchCharacters();
        await fetchPlansAndEquipments();
        
        const message = importedCount > 0 
          ? `角色绑定成功！已自动导入 ${importedCount} 件装备`
          : '角色绑定成功！';
        alert(message);
      } else {
        alert('获取角色信息失败');
      }
    } catch (error) {
      console.error('创建角色失败:', error);
      alert('创建角色失败');
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  const importRoleInfoEquipments = async (characterId: string, roleInfo: any): Promise<number> => {
    if (!roleInfo) return 0;
    
    console.log('roleInfo keys:', Object.keys(roleInfo).slice(0, 20));
    console.log('roleInfo combat keys:', Object.keys(roleInfo).filter(k => k.includes('combat') || k.includes('equip')));
    
    const ds = getDataSource();
    let equips: any[] = [];
    
    const wearEquips = roleInfo['combat_plan.wear_equips'];
    
    if (wearEquips && typeof wearEquips === 'object') {
      console.log('Found wear_equips, keys:', Object.keys(wearEquips));
      equips = parseRawEquipments({ combat_plan: { wear_equips: wearEquips } });
    } else if (roleInfo.character_info?.equipments) {
      equips = roleInfo.character_info.equipments;
    } else if (roleInfo.combat_plan?.wear_equips) {
      equips = parseRawEquipments(roleInfo);
    }
    
    console.log('Found equipments count:', equips.length);
    
    if (equips.length === 0) return 0;
    
    let count = 0;
    
    const slotMap: Record<string, EquipmentSlot> = {
      '1': '主武器', '2': '副武器', '3': '冠胄', '4': '胸甲',
      '5': '胫甲', '8': '腕甲', '9': '射决', '10': '环', '11': '佩', '21': '弓'
    };
    
    const attrNameMap: Record<string, string> = {
      'MIN_W_ATK': '最小外功攻击',
      'MAX_W_ATK': '最大外功攻击',
      'MIN_M_ATK': '最小内功攻击',
      'MAX_M_ATK': '最大内功攻击',
      'DEF': '防御',
      'HP': '气血',
      'PVP_DEF': 'PVP防御',
      'PVE_DEF': 'PVE防御'
    };
    
    for (const equip of equips) {
      try {
        const slot = slotMap[equip.slot];
        if (!slot) {
          console.warn('异常装备部位:', equip.slot, '装备:', equip.name || equip.no);
        }
        const mappedSlot = slot || EQUIPMENT_SLOTS[0];
        const attributes: EquipmentAttribute[] = [];
        
        if (equip.base_attrs) {
          for (const [key, value] of Object.entries(equip.base_attrs)) {
            const name = attrNameMap[key] || key;
            attributes.push({ name, value: value as number, is_main: true });
          }
        }
        
        for (const affix of equip.base_affixes || []) {
          const affixName = affix.name || (affix.id ? `词条${affix.id}` : '未知词条');
          attributes.push({ 
            name: affixName, 
            value: affix.value as number, 
            is_main: affix.is_max as boolean,
            rate: affix.rate as number,
            quality: affix.quality as number
          });
        }
        
        await ds.createEquipment(characterId, {
          slot: mappedSlot,
          name: equip.name || (equip.no ? `装备${equip.no}` : '未知装备'),
          level: equip.level || 0,
          attributes,
          is_wearing: true,
          suit_type: equip.suffix_name && equip.suffix_name !== '无套装' && equip.suffix_name !== '套装0' ? equip.suffix_name as SuitType : undefined
        });
        
        count++;
      } catch (error) {
        console.error('导入装备失败:', equip.name || equip.slot, error);
      }
    }
    
    return count;
  };

  const parseRawEquipments = (data: any): any[] => {
    const wearEquips = data.combat_plan?.wear_equips || {};
    const equipments: any[] = [];
    
    console.log('parseRawEquipments - wearEquips keys:', Object.keys(wearEquips));
    console.log('parseRawEquipments - wearEquips count:', Object.keys(wearEquips).length);
    
    for (const [slot, equipData] of Object.entries(wearEquips)) {
      console.log(`parseRawEquipments - processing slot ${slot}:`, equipData);
      
      const equip = equipData as any;
      const ex = equip.ex || {};
      const suffixId = ex.suffix || 0;
      const baseAffixes = ex.base_affixes || [];
      
      if (!equip.No || equip.No === 0 || equip.No === 2402000) {
        console.log(`parseRawEquipments - 跳过异常装备 slot=${slot}, No=${equip.No}`);
        continue;
      }
      
      if (baseAffixes.length === 0 && Object.keys(ex.base_attrs || {}).length === 0) {
        console.log(`parseRawEquipments - 跳过无属性装备 slot=${slot}, No=${equip.No}`);
        continue;
      }
      
      let equipName = `装备${equip.No || ''}`;
      let suffixName = `套装${suffixId}`;
      let equipLevel = 0;
      
      if (configData?.equip_data) {
        const equipInfo = configData.equip_data[String(equip.No)];
        if (equipInfo) {
          equipName = equipInfo.name;
          equipLevel = equipInfo.level || 0;
        } else {
          console.log(`parseRawEquipments - 装备No=${equip.No}不在配置文件中`);
        }
      }
      
      if (configData?.suffix_data) {
        const suffixInfo = configData.suffix_data[String(suffixId)];
        if (suffixInfo) {
          suffixName = suffixInfo.name;
        }
      }
      
      const equipInfo: any = {
        slot: slot,
        no: equip.No || 0,
        name: equipName,
        level: equipLevel,
        suffix: suffixId,
        suffix_name: suffixName,
        base_attrs: ex.base_attrs || {},
        base_affixes: []
      };
      
      console.log(`parseRawEquipments - slot ${slot} has ${baseAffixes.length} affixes`);
      
      for (const affix of baseAffixes) {
        if (Array.isArray(affix) && affix.length >= 4) {
          let affixName = `词条${affix[0]}`;
          
          if (configData?.affix_data) {
            const affixInfo = configData.affix_data[String(affix[0])];
            if (affixInfo) {
              affixName = affixInfo.name;
            }
          }
          
          equipInfo.base_affixes.push({
            id: affix[0],
            name: affixName,
            value: affix[1],
            rate: Math.round(affix[2] * 100 * 100) / 100,
            quality: affix[3],
            is_max: affix.length > 4 ? affix[4] : false
          });
        }
      }
      
      equipments.push(equipInfo);
    }
    
    console.log('parseRawEquipments - returning', equipments.length, 'equipments');
    return equipments;
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (isLocal) {
        importLocalData(data as Parameters<typeof importLocalData>[0]);
        if (localUserId) {
          const { getCharactersByUserIdLocal } = await import('@/lib/localStore');
          const chars = await getCharactersByUserIdLocal(localUserId);
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

  const getAffixNames = (index?: number) => getAffixNamesBase(index, affixMode);

  const getSuitNames = () => {
    if (!configData?.suffix_data) return [];
    return Object.values(configData.suffix_data).map(s => s.name).filter((name, index, self) => self.indexOf(name) === index).sort();
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
        {/* 未登录状态 */}
        {!authCredentials && (
          <div className="flex items-center gap-4 w-full">
            <div className="text-gray-400">请先扫码登录</div>
            <button
              onClick={() => setShowQRCodeAuth(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg btn-hover font-medium"
            >
              📱 扫码登录
            </button>
          </div>
        )}

        {/* 已登录状态 */}
        {authCredentials && (
          <div className="flex items-center gap-4 w-full flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">已登录</span>
            </div>

            {/* 游戏角色选择下拉 - 随时可用 */}
            {availableGameRoles.length > 0 && (
              <select
                value={selectedGameRoleId}
                onChange={(e) => handleGameRoleSelect(e.target.value)}
                className="min-w-[250px] px-3 py-2 bg-gray-700 rounded-lg"
                disabled={isCreatingCharacter}
              >
                <option value="" disabled>选择游戏角色</option>
                {availableGameRoles.map((role) => {
                  const isAlreadyBound = characters.some(c => 
                    c.role_id === role.roleId && c.server === role.server
                  );
                  return (
                    <option key={role.roleId} value={role.roleId}>
                      {role.nick} - Lv.{role.level} ({role.serverName})
                      {isAlreadyBound ? ' ✓' : ''}
                    </option>
                  );
                })}
              </select>
            )}
            
            {isCreatingCharacter && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                创建角色中...
              </div>
            )}

            {/* 已选择角色的信息显示和操作 */}
            {selectedCharacter && (
              <>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
                  {selectedCharacter.icon && (
                    <img
                      src={selectedCharacter.icon}
                      alt={selectedCharacter.name}
                      className="w-12 h-12 rounded-full border-2 border-green-400"
                    />
                  )}
                  <div>
                    <div className="font-medium text-white">{selectedCharacter.name}</div>
                    {selectedCharacter.level && (
                      <div className="text-sm text-gray-400">等级 {selectedCharacter.level}</div>
                    )}
                    {selectedCharacter.server_name && (
                      <div className="text-sm text-gray-400">{selectedCharacter.server_name}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  {/* 已创建角色选择下拉 */}
                  <select
                    value={selectedCharacter?.id || ''}
                    onChange={(e) => {
                      const char = characters.find(c => c.id === e.target.value);
                      setSelectedCharacter(char || null);
                      setSelectedPlan(null);
                    }}
                    className="min-w-[200px]"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  {/* 切换账号按钮 */}
                  <button
                    onClick={() => setShowQRCodeAuth(true)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                  >
                    切换账号
                  </button>

                  {/* 删除角色按钮 */}
                  <button
                    onClick={handleDeleteCharacter}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                  >
                    删除角色
                  </button>

                  {/* 导出/导入按钮 */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                  >
                    导出/导入数据
                  </button>

                  {/* 调号助手按钮 */}
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/captured');
                        const result = await response.json();
                        if (result.success) {
                          setTuningCapturedData(result.data);
                        } else {
                          setTuningCapturedData(null);
                        }
                      } catch (error) {
                        setTuningCapturedData(null);
                      }
                      setShowTuningAssistant(true);
                    }}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
                  >
                    🤖 调号助手
                  </button>
                </div>
              </>
            )}
          </div>
        )}
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

            <div className="grid grid-cols-5 gap-4 mb-4">
              {filteredEquipments
                .sort((a, b) => {
                  const slotOrder = ['剑', '枪', '冠胄', '胸甲', '弓', '环', '佩', '胫甲', '腕甲', '射决'];
                  const aIndex = slotOrder.indexOf(a.slot);
                  const bIndex = slotOrder.indexOf(b.slot);
                  if (aIndex === -1 && bIndex === -1) return 0;
                  if (aIndex === -1) return 1;
                  if (bIndex === -1) return -1;
                  return aIndex - bIndex;
                })
                .map(equipment => (
                  <EquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    getEquipImageUrl={getEquipImageUrl}
                    configData={configData}
                    onWear={() => handleToggleWearing(equipment)}
                    onUnwear={() => handleToggleWearing(equipment)}
                    onDelete={() => handleDeleteEquipment(equipment.id)}
                    onEdit={() => handleEditEquipment(equipment)}
                  />
                ))}

              <button
                onClick={() => setShowNewEquipmentModal(true)}
                className="equipment-card flex items-center justify-center text-green-400 hover:border-green-400"
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-green-400">角色属性面板</h2>

            {isLoadingRolePanel ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-400 mr-3"></div>
                <span className="text-gray-400">加载中...</span>
              </div>
            ) : rolePanelData ? (
              <div className="space-y-4">
                
                {/* 心法 */}
{(() => {
  const xinfaSource =
    rolePanelData?.['combat_plan.xinfa_info'] ??
    rolePanelData?.xinfa_info;

  if (!xinfaSource || typeof xinfaSource !== 'object') {
    return null;
  }

  return (
    <div className="bg-gray-700/50 p-3 rounded-lg">
      <div className="text-lg font-medium mb-2 text-orange-300">心法</div>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(xinfaSource).map(([id, xinfa]) => {
          const xinfaConfig = getXinfaInfo(id);
          const rank = Number(xinfa?.rank) || 0;
          
         // 兜底：没有配置就不渲染
          if (!xinfaConfig) return null;
 return (
    <div
      key={id}
      className="relative w-[72px] h-[88px] rounded-lg overflow-hidden shadow"
      style={{
        backgroundImage: `url(${xinfaConfig.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 半透明遮罩，让图标更清晰 */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 心法图标 */}
      <img
        src={xinfaConfig.image1}
        alt={xinfaConfig.name}
        className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded"
        onError={(e) => {
          e.currentTarget.src = '/img/default_xinfa.png';
        }}
      />

      {/* 心法名称 */}
      <div className="absolute bottom-5 left-0 right-0 text-[10px] text-center text-white truncate px-1">
        {xinfaConfig.name}
      </div>

      {/* 重数小圆点 */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-[3px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < rank
                ? 'bg-yellow-400 shadow-yellow-400/80'
                : 'bg-gray-500/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
        })}
      </div>
    </div>
  );
})()}
           {/* 概率属性 */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-lg font-medium mb-2 text-yellow-300">三率属性</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-400">精准概率</div>
                      <div className="font-medium">{rolePanelData.ACR_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">实际精准概率</div>
                      <div className="font-medium text-green-300">{rolePanelData.REAL_ACR_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">会心概率</div>
                      <div className="font-medium">{rolePanelData.CRI_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">实际会心概率</div>
                      <div className="font-medium text-green-300">{rolePanelData.REAL_CRI_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">会意概率</div>
                      <div className="font-medium">{rolePanelData.BASH_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">实际会意概率</div>
                      <div className="font-medium text-green-300">{rolePanelData.REAL_BASH_PROB}%</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400">直接会心概率</div>
                      <div className="font-medium">{rolePanelData.DIRECT_CRI_PROB}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">直接会意概率</div>
                      <div className="font-medium">{rolePanelData.DIRECT_BASH_PROB}%</div>
                    </div>
                  </div>
                </div>
                {/* 攻击属性 */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-lg font-medium mb-2 text-green-300">攻击属性</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-400">最小外功攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_W_ATK}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大外功攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_W_ATK}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最小鸣金攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_PRO_ATK_A}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大鸣金攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_PRO_ATK_A}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最小牵丝攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_PRO_ATK_B}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大牵丝攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_PRO_ATK_B}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最小破竹攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_PRO_ATK_C}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大裂石攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_PRO_ATK_C}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最小破竹攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_PRO_ATK_E}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大破竹攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_PRO_ATK_E}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最小无相攻击</div>
                      <div className="font-medium">{rolePanelData.MIN_ACTIVE_PRO_ATK}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">最大无相攻击</div>
                      <div className="font-medium">{rolePanelData.MAX_ACTIVE_PRO_ATK}</div>
                    </div>
                  </div>
                </div>

                {/* 防御属性 */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="text-lg font-medium mb-2 text-blue-300">防御属性</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-400">外攻防御</div>
                      <div className="font-medium">{rolePanelData.W_DEF}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">气血最大值</div>
                      <div className="font-medium">{rolePanelData.hpMax}</div>
                    </div>
                         
                  </div>
                </div>

     

              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>暂无角色面板数据</p>
                <p className="text-sm mt-2">角色信息将在选择角色后自动获取</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-400 mb-4">欢迎使用燕云十六声装备毕业率管理器</h2>
          <p className="text-gray-500 mb-6">
            {!authCredentials 
              ? '请先扫码登录并选择角色开始使用' 
              : '请从上方选择游戏角色开始使用'}
          </p>
          {!authCredentials && (
            <button
              onClick={() => setShowQRCodeAuth(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg btn-hover font-medium"
            >
              📱 扫码登录
            </button>
          )}
        </div>
      )}

      <NewEquipmentModal
        isOpen={showNewEquipmentModal}
        onClose={() => setShowNewEquipmentModal(false)}
        equipmentData={newEquipmentData}
        setEquipmentData={setNewEquipmentData}
        affixMode={affixMode}
        setAffixMode={setAffixMode}
        getEquipNames={getEquipNames}
        getAffixNames={getAffixNames}
        getSlotFromEquipName={getSlotFromEquipName}
        onSubmit={handleCreateEquipment}
      />

      <EditEquipmentModal
        isOpen={showEditEquipmentModal}
        onClose={() => setShowEditEquipmentModal(false)}
        equipment={editingEquipment}
        equipmentData={editEquipmentData}
        setEquipmentData={setEditEquipmentData}
        affixMode={affixMode}
        setAffixMode={setAffixMode}
        getEquipNames={getEquipNames}
        getAffixNames={getAffixNames}
        getSlotFromEquipName={getSlotFromEquipName}
        onSubmit={handleUpdateEquipment}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        onImport={handleImport}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <QRCodeAuthModal
        isOpen={showQRCodeAuth}
        onClose={() => setShowQRCodeAuth(false)}
        onSuccess={handleQRCodeAuthSuccess}
      />

      {showTuningAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">大神AI调号助手</h2>
              <button
                onClick={() => setShowTuningAssistant(false)}
                className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                关闭
              </button>
            </div>
            <TuningAssistantReport equipments={equipments} plan={selectedPlan} capturedData={tuningCapturedData} rolePanelData={rolePanelData} />
          </div>
        </div>
      )}
    </div>
  );
}
