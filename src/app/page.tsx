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
    syncImportedEquipments,
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

        const syncedEquipments = await syncImportedEquipments(selectedCharacter.id, equipmentsList);
        setEquipments(syncedEquipments);
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
        equipments: equipments.filter(equipment => equipment.is_wearing),
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

      const syncedEquipments = await syncImportedEquipments(character.id, equipmentsList, []);
      setSelectedCharacter(character);
      setEquipments(syncedEquipments);
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
  const wearingEquipments = equipments.filter(e => e.is_wearing);
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
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300/80 hidden sm:block">Where Winds Meet</div>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-300 truncate leading-tight">燕云十六声装备毕业率管理器</h1>
          </div>
          <div className="app-header-actions flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={toggleTheme} title={isLightTheme ? '切换至夜间模式' : '切换至白天模式'}>
              {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <a href="https://github.com/simmoc/yanyun-equipment-manager" target="_blank" rel="noopener noreferrer" title="GitHub 仓库" className="hidden sm:inline-flex">
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={() => setShowAboutModal(true)} className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
              <span className="hidden sm:inline">关于本网站</span>
              <span className="sm:hidden">关于</span>
            </Button>
          </div>
        </header>

        <Card className="auth-panel">
          <CardContent className="p-3 sm:p-4">
            {!authCredentials ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-sm">请先扫码登录</span>
                <Button onClick={() => setShowQRCodeAuth(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 text-xs sm:text-sm">
                  <LogIn className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">扫码登录</span><span className="sm:hidden">登录</span>
                </Button>
              </div>
            ) : (
              <div className="auth-logged-in">
                <div className="auth-char-row">
                  <Badge variant="outline" className="border-primary/30 text-primary gap-1 shrink-0">
                    <Check className="w-3 h-3" />已登录
                  </Badge>
                  {isCreatingCharacter && (
                    <div className="loading-state">
                      <span className="loading-orb sm" aria-hidden="true" />
                      创建角色中...
                    </div>
                  )}
                  {selectedCharacter && (
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {selectedCharacter.icon && <img src={selectedCharacter.icon} alt={selectedCharacter.name} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-primary shrink-0" />}
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{selectedCharacter.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {selectedCharacter.level && `Lv.${selectedCharacter.level}`}
                          {selectedCharacter.level && selectedCharacter.server_name && ' · '}
                          {selectedCharacter.server_name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedCharacter && (
                  <div className="auth-actions-row">
                    <Button variant="ghost" size="sm" onClick={() => setShowSelectRoleModal(true)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 sm:h-8 px-2 sm:px-3 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">切换角色</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareCharacter} className="border-primary/30 text-primary hover:bg-primary/10 h-7 sm:h-8 px-2 sm:px-3 text-xs">
                      <Share2 className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">分享角色</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || !authCredentials} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-7 sm:h-8 px-2 sm:px-3 text-xs">
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isRefreshing ? '刷新中...' : '刷新数据'}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-7 sm:h-8 px-2 sm:px-3 text-xs">
                      <Download className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">导出/导入</span>
                    </Button>
                    <Button size="sm" onClick={() => setShowTuningAssistant(true)} className="bg-purple-600 hover:bg-purple-700 text-white h-7 sm:h-8 px-2 sm:px-3 text-xs">
                      <Bot className="w-3.5 h-3.5 sm:mr-1.5" />调号
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { clearAuthCredentials(); setSelectedCharacter(null); setSelectedPlan(null); setEquipments([]); setRolePanelData(null); localStorage.removeItem('qrcode_auth_cache'); setShowQRCodeAuth(true); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 sm:h-8 px-2 sm:px-3 text-xs ml-auto">
                      <LogOut className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">退出账号</span>
                    </Button>
                  </div>
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
              <DPSGraduationPanel
                rolePanelData={rolePanelData}
                selectedPlan={selectedPlan}
                equipments={wearingEquipments}
              />
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
                          { label: '最小裂石', field: 'MIN_PRO_ATK_B', value: rolePanelData.MIN_PRO_ATK_B },
                          { label: '最大裂石', field: 'MAX_PRO_ATK_B', value: rolePanelData.MAX_PRO_ATK_B },
                          { label: '最小牵丝', field: 'MIN_PRO_ATK_C', value: rolePanelData.MIN_PRO_ATK_C },
                          { label: '最大牵丝', field: 'MAX_PRO_ATK_C', value: rolePanelData.MAX_PRO_ATK_C },
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
          equipments={wearingEquipments}
          plan={selectedPlan}
          rolePanelData={rolePanelData}
          xinfaNameMap={xinfaNameMap}
        />
      </main>
    </div>
  );
}
