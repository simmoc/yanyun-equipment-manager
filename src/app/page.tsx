'use client';

import { useState, useEffect, useRef } from 'react';
import type { Character, Plan, Equipment, EquipmentSlot, FlowType, VersionType, BowType, SuitType, EquipmentAttribute, GameRole, RolePanelData } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { exportLocalData, importLocalData } from '@/lib/localStore';
import { getDataSource } from '@/lib/dataSource';
import { parseRawEquipments, convertToEquipmentList } from '@/lib/equipmentParser';
import { ensureConfigData } from '@/lib/configStore';
import { fetchNetEaseRoleInfo, fetchNetEaseRolePanel } from '@/lib/neteaseClient';
import { useAppData, useConfigData } from '@/hooks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  NewEquipmentModal,
  EditEquipmentModal,
  ExportModal,
  AboutModal,
  EquipmentCard,
  TuningAssistantModal,
  QRCodeAuthModal,
  SelectRoleModal,
  DPSGraduationPanel,
} from '@/components';
import {
  LogIn, LogOut, Share2, RefreshCw, Trash2, Download, Upload, Bot,
  Check, User, ChevronDown, ArrowUpDown, Plus, Sun, Moon
} from 'lucide-react';

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

  const [equipmentFilter, setEquipmentFilter] = useState<'可用' | '全部' | '穿着'>('可用');
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | '全部'>('全部');

  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showEditEquipmentModal, setShowEditEquipmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTuningAssistant, setShowTuningAssistant] = useState(false);
  const [showQRCodeAuth, setShowQRCodeAuth] = useState(false);
  const [showSelectRoleModal, setShowSelectRoleModal] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    setIsLightTheme(document.documentElement.classList.contains('light'));
  }, []);

  const toggleTheme = () => {
    const next = !isLightTheme;
    setIsLightTheme(next);
    document.documentElement.classList.toggle('light', next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
  };

  useEffect(() => {
    if (pendingRoleSelector) {
      setShowSelectRoleModal(true);
      setPendingRoleSelector(false);
    }
  }, [pendingRoleSelector]);

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

  const [selectedGameRoleId, setSelectedGameRoleId] = useState<string>('');
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevAuthRef = useRef(authCredentials);

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

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      await ds.deleteCharacter(selectedCharacter.id);
      const chars = await fetchCharacters();
      setSelectedCharacter(chars[0] || null);
      toast.success('角色已删除');
    } catch (error) {
      console.error('删除角色失败:', error);
      toast.error('删除角色失败');
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
      await fetchPlansAndEquipments();
      setNewEquipmentData({
        slot: EQUIPMENT_SLOTS[0],
        name: '',
        level: 0,
        attributes: [{ name: '', value: 0, is_main: true }],
        isWearing: false,
        suitType: ''
      });
      toast.success('装备已创建');
    } catch (error) {
      console.error('创建装备失败:', error);
      toast.error('创建装备失败');
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      const ds = getDataSource();
      await ds.deleteEquipment(equipmentId);
      await fetchPlansAndEquipments();
      toast.success('装备已删除');
    } catch (error) {
      console.error('删除装备失败:', error);
      toast.error('删除装备失败');
    }
  };

  const handleToggleWearing = async (equipment: Equipment) => {
    try {
      const ds = getDataSource();
      await ds.updateEquipment(equipment.id, { is_wearing: !equipment.is_wearing });
      await fetchPlansAndEquipments();
    } catch (error) {
      console.error('更新装备失败:', error);
      toast.error('更新装备失败');
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
      await fetchPlansAndEquipments();
      toast.success('装备已更新');
    } catch (error) {
      console.error('更新装备失败:', error);
      toast.error('更新装备失败');
    }
  };

  const handleRefresh = async () => {
    if (!selectedCharacter || !authCredentials) return;
    setIsRefreshing(true);
    try {
      const roleRequest = {
        roleId: selectedCharacter.role_id || '',
        server: selectedCharacter.server || '',
        cookies: authCredentials.cookies,
        loginToken: authCredentials.loginToken
      };
      const [roleInfoResult, panelResult] = await Promise.all([
        fetchNetEaseRoleInfo(roleRequest),
        fetchNetEaseRolePanel(roleRequest)
      ]);

      if (roleInfoResult.needReauth || panelResult.needReauth) {
        clearAuthCredentials();
        setShowQRCodeAuth(true);
        toast.error('登录已过期，请重新扫码登录');
        return;
      }

      if (roleInfoResult.success && roleInfoResult.data?.roleInfo) {
        const latestConfigData = await ensureConfigData().catch(() => configData);
        const rawEquips = parseRawEquipments(roleInfoResult.data.roleInfo, latestConfigData);
        const equipmentsList = convertToEquipmentList(rawEquips);

        const authKey = `auth_${selectedCharacter.role_id}`;
        const authDataStr = localStorage.getItem(authKey);
        const authData = authDataStr ? JSON.parse(authDataStr) : {};
        authData.roleInfo = roleInfoResult.data.roleInfo;
        authData.reportToken = roleInfoResult.data.reportToken;
        authData.equipments = equipmentsList;
        if (panelResult.success && panelResult.data) authData.rolePanelData = panelResult.data;
        localStorage.setItem(authKey, JSON.stringify(authData));

        setEquipments(equipmentsList);
        if (panelResult.success && panelResult.data) {
          const panelData = panelResult.data;
          if (!panelData['combat_plan.xinfa_info'] && !panelData.xinfa_info) {
            const ri = roleInfoResult.data.roleInfo;
            if (ri['combat_plan.xinfa_info']) panelData['combat_plan.xinfa_info'] = ri['combat_plan.xinfa_info'];
            else if (ri.xinfa_info) panelData['combat_plan.xinfa_info'] = ri.xinfa_info;
            if (ri['base.nickname']) panelData['base.nickname'] = ri['base.nickname'];
            if (ri['base.level']) panelData['base.level'] = ri['base.level'];
          }
          setRolePanelData(panelData);
        }
        toast.success('数据已刷新');
      } else {
        toast.error(roleInfoResult.error || '刷新数据失败');
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      toast.error('刷新数据失败');
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
        equipments,
        rolePanelData,
        createdAt: new Date().toISOString()
      };
      const { id: shareId } = await ds.createShare(snapshot);
      await navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
      toast.success('分享链接已复制到剪贴板');
    } catch (error) {
      console.error('创建分享失败:', error);
      toast.error('创建分享失败');
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

  const handleQRCodeAuthSuccess = async (cookies: any, loginToken: string, roles: GameRole[]) => {
    saveAuthCredentials(cookies, loginToken, roles);
    setShowQRCodeAuth(false);
    setSelectedCharacter(null);
    setSelectedPlan(null);
    setEquipments([]);
    setRolePanelData(null);
    await fetchCharacters();
    setShowSelectRoleModal(true);
  };

  const handleSelectCharacter = (character: Character) => {
    const ownsCharacter = availableGameRoles.some(role =>
      role.roleId === character.role_id && (!character.server || role.server === character.server)
    );
    if (!ownsCharacter) {
      toast.error('该角色不属于当前扫码账号，请重新选择');
      return;
    }
    setShowSelectRoleModal(false);
    setSelectedCharacter(character);
  };

  const handleBindGameRole = (gameRoleId: string) => {
    setShowSelectRoleModal(false);
    handleGameRoleSelect(gameRoleId);
  };

  const handleGameRoleSelect = async (gameRoleId: string) => {
    setSelectedGameRoleId(gameRoleId);
    if (!gameRoleId || !authCredentials) return;

    const gameRole = availableGameRoles.find(r => r.roleId === gameRoleId);
    if (!gameRole) return;

    const existingCharacter = characters.find(c => c.role_id === gameRoleId && c.server === gameRole.server);
    if (existingCharacter) {
      setSelectedCharacter(existingCharacter);
      setSelectedGameRoleId('');
      return;
    }

    setIsCreatingCharacter(true);
    try {
      const ds = getDataSource();
      const roleRequest = {
        roleId: gameRole.roleId,
        server: gameRole.server,
        cookies: authCredentials.cookies,
        loginToken: authCredentials.loginToken
      };
      const [roleInfoResult, panelResult] = await Promise.all([
        fetchNetEaseRoleInfo(roleRequest),
        fetchNetEaseRolePanel(roleRequest)
      ]);

      if (roleInfoResult.needReauth || panelResult.needReauth) {
        clearAuthCredentials();
        setShowQRCodeAuth(true);
        toast.error('登录已过期，请重新扫码登录');
        return;
      }

      if (!roleInfoResult.success) {
        toast.error(roleInfoResult.error || '获取角色信息失败');
        return;
      }

      const rolePanelData = panelResult.success ? panelResult.data : null;
      const character = await ds.createCharacter(gameRole.nick, {
        icon: gameRole.icon,
        level: gameRole.level,
        server_name: gameRole.serverName,
        role_id: gameRole.roleId,
        server: gameRole.server
      });

      const latestConfigData = await ensureConfigData().catch(() => configData);
      const rawEquips = parseRawEquipments(roleInfoResult.data.roleInfo, latestConfigData);
      const equipmentsList = convertToEquipmentList(rawEquips);

      localStorage.setItem(`auth_${character.role_id}`, JSON.stringify({
        roleId: gameRole.roleId,
        server: gameRole.server,
        cookies: authCredentials.cookies,
        loginToken: authCredentials.loginToken,
        roleInfo: roleInfoResult.data.roleInfo,
        reportToken: roleInfoResult.data.reportToken,
        rolePanelData,
        equipments: equipmentsList
      }));

      setSelectedCharacter(character);
      setSelectedGameRoleId('');
      await fetchCharacters();
      await fetchPlansAndEquipments();
      toast.success(equipmentsList.length > 0 ? `角色绑定成功！已加载 ${equipmentsList.length} 件装备` : '角色绑定成功！');
    } catch (error) {
      console.error('创建角色失败:', error);
      toast.error(error instanceof Error ? error.message : '角色绑定失败，请稍后重试');
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
        toast.success('导入成功！');
      } else {
        const ds = getDataSource();
        await ds.importData(data);
        toast.success('导入成功！');
        await fetchCharacters();
      }
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请检查文件格式');
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
  const xinfaNameMap = configData?.xinfa_data
    ? Object.fromEntries(Object.entries(configData.xinfa_data).map(([id, xinfa]) => [id, xinfa.name]))
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-state vertical">
          <span className="loading-orb lg" aria-hidden="true" />
          <p className="text-muted-foreground">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="app-shell">
        <header className="app-header">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">Where Winds Meet</div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-300">燕云十六声装备毕业率管理器</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} title={isLightTheme ? '切换至夜间模式' : '切换至白天模式'}>
              {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={() => setShowAboutModal(true)}>关于本网站</Button>
          </div>
        </header>

        <Card className="auth-panel">
          <CardContent className="p-4">
            {!authCredentials ? (
              <div className="flex items-center gap-4 w-full">
                <span className="text-muted-foreground">请先扫码登录</span>
                <Button onClick={() => setShowQRCodeAuth(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="w-4 h-4 mr-2" />扫码登录
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 w-full flex-wrap">
                <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                  <Check className="w-3 h-3" />已登录
                </Badge>
                {isCreatingCharacter && (
                  <div className="loading-state">
                    <span className="loading-orb sm" aria-hidden="true" />
                    创建角色中...
                  </div>
                )}
                {selectedCharacter && (
                  <>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="flex items-center gap-3">
                      {selectedCharacter.icon && <img src={selectedCharacter.icon} alt={selectedCharacter.name} className="w-12 h-12 rounded-full border-2 border-primary" />}
                      <div>
                        <div className="font-medium">{selectedCharacter.name}</div>
                        {selectedCharacter.level && <div className="text-sm text-muted-foreground">等级 {selectedCharacter.level}</div>}
                        {selectedCharacter.server_name && <div className="text-sm text-muted-foreground">{selectedCharacter.server_name}</div>}
                      </div>
                      <Button variant="ghost" onClick={() => setShowSelectRoleModal(true)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <ArrowUpDown className="w-4 h-4 mr-1.5" />切换角色
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareCharacter} className="border-primary/30 text-primary hover:bg-primary/10">
                        <Share2 className="w-4 h-4 mr-1.5" />分享角色
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || !authCredentials} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                        <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? '刷新中...' : '刷新数据'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { clearAuthCredentials(); setSelectedCharacter(null); setSelectedPlan(null); setEquipments([]); setRolePanelData(null); localStorage.removeItem('qrcode_auth_cache'); setShowQRCodeAuth(true); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <LogOut className="w-4 h-4 mr-1.5" />退出账号
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto max-sm:w-full max-sm:mt-2">
                      <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <Download className="w-4 h-4 mr-1.5" />导出/导入
                      </Button>
                      <Button size="sm" onClick={() => setShowTuningAssistant(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Bot className="w-4 h-4 mr-1.5" />调号
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCharacter ? (
          <div className="main-layout">
            <div className="content-column">
              <div className="surface-panel filter-panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="filter-group">
                    <span className="filter-label">范围</span>
                    {['可用', '全部', '穿着'].map(filter => (
                      <button key={filter} onClick={() => setEquipmentFilter(filter as any)} className={`btn ${equipmentFilter === filter ? 'btn-primary' : 'btn-secondary'}`}>
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-group filter-separator">
                  <span className="filter-label">部位</span>
                  <button onClick={() => setSlotFilter('全部')} className={`btn ${slotFilter === '全部' ? 'btn-primary' : 'btn-secondary'}`}>全部</button>
                  {EQUIPMENT_SLOTS.map(slot => (
                    <button key={slot} onClick={() => setSlotFilter(slot)} className={`btn ${slotFilter === slot ? 'btn-primary' : 'btn-secondary'}`}>{slot}</button>
                  ))}
                </div>
              </div>

              <div className="equipment-grid">
                {filteredEquipments.sort((a, b) => {
                  const slotOrder = ['剑', '枪', '冠胄', '胸甲', '弓', '环', '佩', '胫甲', '腕甲', '射决'];
                  const aIndex = slotOrder.indexOf(a.slot);
                  const bIndex = slotOrder.indexOf(b.slot);
                  if (aIndex === -1 && bIndex === -1) return 0;
                  if (aIndex === -1) return 1;
                  if (bIndex === -1) return -1;
                  return aIndex - bIndex;
                }).map(equipment => (
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

            <div className="sidebar-stack">
              <div className="surface-panel sidebar-panel">
                <h2 className="sidebar-panel-title text-base font-bold text-green-400">角色属性</h2>
                {isLoadingRolePanel ? (
                  <div className="loading-state py-4">
                    <span className="loading-orb" aria-hidden="true" />
                    <span>加载中...</span>
                  </div>
                ) : rolePanelData ? (
                  <div className="space-y-3">
                    <div className="stat-block bg-gray-700/50">
                      <div className="text-sm font-medium mb-1.5 text-orange-300">心法</div>
                      <div className="xinfa-grid">
                        {Object.entries(rolePanelData?.['combat_plan.xinfa_info'] ?? rolePanelData?.xinfa_info ?? {}).map(([id, xinfa]) => {
                          const xinfaConfig = getXinfaInfo(Number(id) || 0);
                          const xinfaObj = xinfa as any;
                          const rank = Number(xinfaObj?.rank) || 0;
                          if (!xinfaConfig) return null;
                          return (
                            <div key={id} className="xinfa-card">
                              <div className="xinfa-card-glow" aria-hidden="true" />
                              <div className="xinfa-icon-frame">
                                <img src={xinfaConfig.image1} alt={xinfaConfig.name} className="xinfa-icon" onError={(e) => { e.currentTarget.src = '/img/default_xinfa.png'; }} />
                              </div>
                              <div className="xinfa-name" title={xinfaConfig.name}>{xinfaConfig.name}</div>
                              <div className="xinfa-rank-dots" aria-label={`心法突破 ${rank} 阶`}>
                                {Array.from({ length: 6 }).map((_, i) => <span key={i} className={i < rank ? 'xinfa-rank-dot active' : 'xinfa-rank-dot'} />)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="stat-block bg-gray-700/50">
                      <div className="text-sm font-medium mb-1 text-yellow-300">三率属性</div>
                      <div className="stat-grid grid grid-cols-2">
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
                    <div className="stat-block bg-gray-700/50">
                      <div className="text-sm font-medium mb-1 text-green-300">攻击属性</div>
                      <div className="stat-grid grid grid-cols-2">
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
                    <div className="stat-block bg-gray-700/50">
                      <div className="text-sm font-medium mb-1 text-blue-300">防御属性</div>
                      <div className="stat-grid grid grid-cols-2">
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

              <DPSGraduationPanel
                rolePanelData={rolePanelData}
                selectedPlan={selectedPlan}
                equipments={equipments}
              />
            </div>
          </div>
        ) : (
          <div className="surface-panel mx-auto max-w-2xl px-6 py-10 text-center">
            <h2 className="mb-3 text-xl font-semibold text-white">选择角色开始计算</h2>
            <p className="mb-6 text-sm text-gray-400">
              {!authCredentials ? '扫码登录后会读取角色列表，并加载装备、面板和毕业率结果。' : '从当前账号绑定的游戏角色中选择一个继续。'}
            </p>
            {authCredentials && (
              <button onClick={() => setShowSelectRoleModal(true)} className="btn btn-primary mx-auto">选择角色</button>
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

        <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
        <QRCodeAuthModal isOpen={showQRCodeAuth} onClose={() => setShowQRCodeAuth(false)} onSuccess={handleQRCodeAuthSuccess} />
        <SelectRoleModal
          isOpen={showSelectRoleModal}
          onClose={() => setShowSelectRoleModal(false)}
          roles={availableGameRoles}
          characters={characters}
          onSelect={handleBindGameRole}
          onSelectCharacter={handleSelectCharacter}
          isLoading={isLoadingRolePanel}
        />
        <TuningAssistantModal
          isOpen={showTuningAssistant}
          onClose={() => setShowTuningAssistant(false)}
          equipments={equipments}
          plan={selectedPlan}
          rolePanelData={rolePanelData}
          xinfaNameMap={xinfaNameMap}
        />
      </main>
    </div>
  );
}
