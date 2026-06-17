'use client';

import { useState, useEffect, useRef } from 'react';
import type { Character, Plan, Equipment, GraduationResult, EquipmentSlot, FlowType, VersionType, BowType, SuitType, EquipmentAttribute, GameRole, RolePanelData } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { getGraduationLevel, getGraduationColor } from '@/lib/graduation';
import { exportLocalData, importLocalData } from '@/lib/localStore';
import { getDataSource } from '@/lib/dataSource';
import { parseRawEquipments, convertToEquipmentList } from '@/lib/equipmentParser';
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
    isLoading,
    isLocal,
    characters,
    selectedCharacter,
    setSelectedCharacter,
    plans,
    selectedPlan,
    setSelectedPlan,
    equipments,
    setEquipments,
    authCredentials,
    availableGameRoles,
    rolePanelData,
    setRolePanelData,
    isLoadingRolePanel,
    pendingRoleSelector,
    setPendingRoleSelector,
    fetchCharacters,
    fetchPlansAndEquipments,
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

  useEffect(() => {
    if (pendingRoleSelector) {
      setShowSelectRoleModal(true);
      setPendingRoleSelector(false);
    }
  }, [pendingRoleSelector]);
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    if (!selectedCharacter || !authCredentials) return;
    setIsRefreshing(true);
    try {
      const [roleInfoRes, panelRes] = await Promise.all([
        fetch('/api/auth/role-info', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: selectedCharacter.role_id,
            server: selectedCharacter.server,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        }),
        fetch('/api/auth/role-panel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: selectedCharacter.role_id,
            server: selectedCharacter.server,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        })
      ]);

      const roleInfoResult = await roleInfoRes.json();
      const panelResult = await panelRes.json();

      if (roleInfoResult.needReauth || panelResult.needReauth) {
        clearAuthCredentials();
        setShowQRCodeAuth(true);
        setToast({ message: '登录已过期，请重新扫码登录', type: 'error' });
        return;
      }

      if (roleInfoResult.success && roleInfoResult.data?.roleInfo) {
        const rawEquips = parseRawEquipments(roleInfoResult.data.roleInfo, configData);
        const equipmentsList = convertToEquipmentList(rawEquips);

        const authKey = `auth_${selectedCharacter.role_id}`;
        const authDataStr = localStorage.getItem(authKey);
        const authData = authDataStr ? JSON.parse(authDataStr) : {};
        authData.roleInfo = roleInfoResult.data.roleInfo;
        authData.reportToken = roleInfoResult.data.reportToken;
        authData.equipments = equipmentsList;
        if (panelResult.success && panelResult.data) {
          authData.rolePanelData = panelResult.data;
        }
        localStorage.setItem(authKey, JSON.stringify(authData));

        setEquipments(equipmentsList);
        if (panelResult.success && panelResult.data) {
          const panelData = panelResult.data;
          if (!panelData['combat_plan.xinfa_info'] && !panelData.xinfa_info) {
            const ri = roleInfoResult.data.roleInfo;
            if (ri['combat_plan.xinfa_info']) {
              panelData['combat_plan.xinfa_info'] = ri['combat_plan.xinfa_info'];
            } else if (ri.xinfa_info) {
              panelData['combat_plan.xinfa_info'] = ri.xinfa_info;
            }
            if (ri['base.nickname']) panelData['base.nickname'] = ri['base.nickname'];
            if (ri['base.level']) panelData['base.level'] = ri['base.level'];
          }
          setRolePanelData(panelData);
        }
        setToast({ message: '数据已刷新', type: 'success' });
      } else {
        setToast({ message: roleInfoResult.error || '刷新数据失败', type: 'error' });
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      setToast({ message: '刷新数据失败', type: 'error' });
    } finally {
      setIsRefreshing(false);
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

  // 弹窗中选择已有角色
  const handleSelectCharacter = (character: Character) => {
    setShowSelectRoleModal(false);
    setSelectedCharacter(character);
  };

  // 弹窗中绑定新角色
  const handleBindGameRole = (gameRoleId: string) => {
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
      return;
    }
    
    // 创建新角色
    setIsCreatingCharacter(true);
    try {
      const ds = getDataSource();
      
      // 同时获取角色信息和面板数据
      const [roleInfoResponse, panelResponse] = await Promise.all([
        fetch('/api/auth/role-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: gameRole.roleId,
            server: gameRole.server,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        }),
        fetch('/api/auth/role-panel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: gameRole.roleId,
            server: gameRole.server,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        })
      ]);
      
      const roleInfoResult = await roleInfoResponse.json();
      const panelResult = await panelResponse.json();
      
      if (roleInfoResult.needReauth || panelResult.needReauth) {
        clearAuthCredentials();
        setShowQRCodeAuth(true);
        setToast({ message: '登录已过期，请重新扫码登录', type: 'error' });
        return;
      }
      
      if (!roleInfoResult.success) {
        setToast({ message: roleInfoResult.error || '获取角色信息失败', type: 'error' });
        return;
      }
      
      const rolePanelData = panelResult.success ? panelResult.data : null;
      
      // 等待两个API结果后，再创建角色
      const character = await ds.createCharacter(gameRole.nick, {
        icon: gameRole.icon,
        level: gameRole.level,
        server_name: gameRole.serverName,
        role_id: gameRole.roleId,
        server: gameRole.server
      });
      
      // 解析装备并保存到auth缓存
      const rawEquips = parseRawEquipments(roleInfoResult.data.roleInfo, configData);
      const equipmentsList = convertToEquipmentList(rawEquips);

      localStorage.setItem(`auth_${character.role_id}`, JSON.stringify({
        roleId: gameRole.roleId,
        server: gameRole.server,
        cookies: authCredentials.cookies,
        loginToken: authCredentials.loginToken,
        roleInfo: roleInfoResult.data.roleInfo,
        reportToken: roleInfoResult.data.reportToken,
        rolePanelData: rolePanelData,
        equipments: equipmentsList
      }));
      
      setSelectedCharacter(character);
      setSelectedGameRoleId('');
      await fetchCharacters();
      await fetchPlansAndEquipments();
      
      setToast({
        message: equipmentsList.length > 0 
          ? `角色绑定成功！已加载 ${equipmentsList.length} 件装备`
          : '角色绑定成功！',
        type: 'success'
      });
    } catch (error) {
      console.error('创建角色失败:', error);
      clearAuthCredentials();
      setShowQRCodeAuth(true);
      setToast({ message: '登录已过期，请重新扫码登录', type: 'error' });
    } finally {
      setIsCreatingCharacter(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (isLocal) {
        importLocalData(data as Parameters<typeof importLocalData>[0]);
        const { getCharactersLocal } = await import('@/lib/localStore');
        const chars = await getCharactersLocal();
        setSelectedCharacter(chars.length > 0 ? chars[0] : null);
        setToast({ message: '导入成功！', type: 'success' });
      } else {
        const ds = getDataSource();
        await ds.importData(data);
        setToast({ message: '导入成功！', type: 'success' });
        await fetchCharacters();
      }
    } catch (error) {
      console.error('导入失败:', error);
      setToast({ message: '导入失败，请检查文件格式', type: 'error' });
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

                  {/* 刷新数据按钮 */}
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || !authCredentials}
                    className="px-3 sm:px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition text-sm sm:text-base disabled:opacity-50"
                  >
                    {isRefreshing ? '刷新中...' : '刷新数据'}
                  </button>

                  {/* 切换角色按钮 */}
                  <button
                    onClick={() => setShowSelectRoleModal(true)}
                    className="px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm sm:text-base"
                  >
                    切换角色
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
                      { label: '最小外功', field: 'MIN_W_ATK', value: rolePanelData.MIN_W_ATK },
                      { label: '最大外功', field: 'MAX_W_ATK', value: rolePanelData.MAX_W_ATK },
                      { label: '最小鸣金', field: 'MIN_PRO_ATK_A', value: rolePanelData.MIN_PRO_ATK_A },
                      { label: '最大鸣金', field: 'MAX_PRO_ATK_A', value: rolePanelData.MAX_PRO_ATK_A },
                      { label: '最小牵丝', field: 'MIN_PRO_ATK_B', value: rolePanelData.MIN_PRO_ATK_B },
                      { label: '最大牵丝', field: 'MAX_PRO_ATK_B', value: rolePanelData.MAX_PRO_ATK_B },
                      { label: '最小裂石', field: 'MIN_PRO_ATK_C', value: rolePanelData.MIN_PRO_ATK_C },
                      { label: '最大裂石', field: 'MAX_PRO_ATK_C', value: rolePanelData.MAX_PRO_ATK_C },
                      { label: '最小破竹', field: 'MIN_PRO_ATK_E', value: rolePanelData.MIN_PRO_ATK_E },
                      { label: '最大破竹', field: 'MAX_PRO_ATK_E', value: rolePanelData.MAX_PRO_ATK_E },
                      { label: '最小无相', field: 'MIN_ACTIVE_PRO_ATK', value: rolePanelData.MIN_ACTIVE_PRO_ATK },
                      { label: '最大无相', field: 'MAX_ACTIVE_PRO_ATK', value: rolePanelData.MAX_ACTIVE_PRO_ATK },
                    ].map(item => (
                      <div key={item.field} className="flex justify-between items-center gap-1">
                        <span className="text-xs text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
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
        onSelect={handleBindGameRole}
        onSelectCharacter={handleSelectCharacter}
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
