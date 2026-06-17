'use client';

import { useState, useEffect, useRef } from 'react';
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
  QRCodeAuthModal,
  SelectRoleModal,
  Toast
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
    clearAuthCredentials,
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
  const [showSelectRoleModal, setShowSelectRoleModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
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

  const prevAuthRef = useRef(authCredentials);

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

  useEffect(() => {
    if (prevAuthRef.current && !authCredentials) {
      setShowQRCodeAuth(true);
    }
    prevAuthRef.current = authCredentials;
  }, [authCredentials]);

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

  const handleShareCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      const snapshot = {
        character: {
          name: selectedCharacter.name,
          icon: selectedCharacter.icon,
          level: selectedCharacter.level,
          server_name: selectedCharacter.server_name,
        },
        equipments: equipments,
        rolePanelData: rolePanelData,
        createdAt: new Date().toISOString()
      };
      const { id: shareId } = await ds.createShare(snapshot);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      setToast({ message: '分享链接已复制到剪贴板', type: 'success' });
    } catch (error) {
      console.error('创建分享失败:', error);
      setToast({ message: '创建分享失败', type: 'error' });
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

  // 扫码登录成功，保存凭证并弹出角色选择
  const handleQRCodeAuthSuccess = (cookies: any, loginToken: string, roles: GameRole[]) => {
    saveAuthCredentials(cookies, loginToken, roles);
    setShowQRCodeAuth(false);
    setShowSelectRoleModal(true);
  };

  // 弹窗中选择角色
  const handleModalRoleSelect = (gameRoleId: string) => {
    setShowSelectRoleModal(false);
    handleGameRoleSelect(gameRoleId);
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
      
      if (result.needReauth) {
        clearAuthCredentials();
        setShowQRCodeAuth(true);
        setToast({ message: `登录已过期：${result.error}，请重新扫码登录`, type: 'error' });
        return;
      }
      
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
          if (panelResult.needReauth) {
            clearAuthCredentials();
            setShowQRCodeAuth(true);
            setToast({ message: `登录已过期：${panelResult.error}，请重新扫码登录`, type: 'error' });
            return;
          }
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
        
        setToast({
          message: importedCount > 0 
            ? `角色绑定成功！已自动导入 ${importedCount} 件装备`
            : '角色绑定成功！',
          type: 'success'
        });
      } else {
        if (result.needReauth) {
          clearAuthCredentials();
          setShowQRCodeAuth(true);
          setToast({ message: `登录已过期：${result.error}，请重新扫码登录`, type: 'error' });
          return;
        }
        setToast({ message: result.error || '获取角色信息失败', type: 'error' });
      }
    } catch (error) {
      console.error('创建角色失败:', error);
      clearAuthCredentials();
      setShowQRCodeAuth(true);
      setToast({ message: '登录已过期，请重新扫码登录', type: 'error' });
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
      'W_DEF': '外功防御',
      'HP': '气血',
      'HP_MAX': '气血上限',
      'ARCHER_DAMAGE': '穿透伤害',
      'ARCHER_WEAKPOINT_DAMAGE': '穿透弱点伤害',
      'PVP_DEF': 'PVP防御',
      'PVE_DEF': 'PVE防御',
      'CRI_PROB': '会心率',
      'ACR_PROB': '精准率',
      'BASH_PROB': '会意率',
      'PVP_CRI_PROB': 'PVP会心率',
      'PVP_ACR_PROB': 'PVP精准率',
      'PVP_BASH_PROB': 'PVP会意率',
      'STR': '力道',
      'BAS': '气韵',
      'CON': '根骨',
      'CRI': '身法',
      'FIRE_ATK': '火攻击',
      'ICE_ATK': '冰攻击',
      'THUNDER_ATK': '雷攻击',
      'WIND_ATK': '风攻击',
      'FIRE_DEF': '火抗',
      'ICE_DEF': '冰抗',
      'THUNDER_DEF': '雷抗',
      'WIND_DEF': '风抗'
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
                
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto max-sm:w-full max-sm:mt-2">
                  {/* 分享角色按钮 */}
                  <button
                    onClick={handleShareCharacter}
                    className="px-3 sm:px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition text-sm sm:text-base"
                  >
                    分享角色
                  </button>

                  {/* 切换账号按钮 */}
                  <button
                    onClick={() => setShowQRCodeAuth(true)}
                    className="px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm sm:text-base"
                  >
                    切换账号
                  </button>

                  {/* 删除角色按钮 */}
                  <button
                    onClick={handleDeleteCharacter}
                    className="px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm sm:text-base"
                  >
                    删除角色
                  </button>

                  {/* 导出/导入按钮 */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm sm:text-base"
                  >
                    导出/导入
                  </button>

                  {/* 调号助手按钮 */}
                  <button
                    onClick={() => setShowTuningAssistant(true)}
                    className="px-3 sm:px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition text-sm sm:text-base"
                  >
                    🤖 调号
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
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
              {['可用', '全部', '穿着'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setEquipmentFilter(filter as any)}
                  className={`tab-button ${equipmentFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
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

            </div>
          </div>

          <div className="bg-gray-800/50 p-3 rounded-lg">
            <h2 className="text-base font-bold mb-2 text-green-400">角色属性</h2>

            {isLoadingRolePanel ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-400 mr-2"></div>
                <span className="text-gray-400 text-sm">加载中...</span>
              </div>
            ) : rolePanelData ? (
              <div className="space-y-2">
                
                {/* 心法 */}
{(() => {
  const xinfaSource =
    rolePanelData?.['combat_plan.xinfa_info'] ??
    rolePanelData?.xinfa_info;

  if (!xinfaSource || typeof xinfaSource !== 'object') {
    return null;
  }

  return (
    <div className="bg-gray-700/50 p-2 rounded-lg">
      <div className="text-sm font-medium mb-1.5 text-orange-300">心法</div>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(xinfaSource).map(([id, xinfa]) => {
          const xinfaConfig = getXinfaInfo(Number(id) || 0);
          const xinfaObj = xinfa as any;
          const rank = Number(xinfaObj?.rank) || 0;
          
          if (!xinfaConfig) return null;
          return (
            <div
              key={id}
              className="relative w-[60px] h-[74px] rounded-lg overflow-hidden shadow"
              style={{
                backgroundImage: `url(${xinfaConfig.bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <img
                src={xinfaConfig.image1}
                alt={xinfaConfig.name}
                className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded"
                onError={(e) => { e.currentTarget.src = '/img/default_xinfa.png'; }}
              />
              <div className="absolute bottom-4 left-0 right-0 text-[9px] text-center text-white truncate px-0.5">
                {xinfaConfig.name}
              </div>
              <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-[2px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full ${i < rank ? 'bg-yellow-400' : 'bg-gray-500/70'}`} />
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
                <p className="text-xs mt-1">选择角色后自动获取</p>
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

      <SelectRoleModal
        isOpen={showSelectRoleModal}
        onClose={() => setShowSelectRoleModal(false)}
        roles={availableGameRoles}
        characters={characters}
        onSelect={handleModalRoleSelect}
        isLoading={isCreatingCharacter}
      />

      <Toast
        isOpen={!!toast}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
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
            <TuningAssistantReport equipments={equipments} plan={selectedPlan} rolePanelData={rolePanelData} />
          </div>
        </div>
      )}
    </div>
  );
}
