'use client';

import { useState, useEffect, useRef } from 'react';
import type { Character, Plan, Equipment, GraduationResult, EquipmentSlot, FlowType, VersionType, BowType, SuitType, EquipmentAttribute, GameRole, RolePanelData } from '@/types';
import { FLOW_TYPES, VERSIONS, FLOW_CATEGORIES, EQUIPMENT_SLOTS, BOW_TYPES, SUIT_TYPES } from '@/types';
import { getGraduationLevel, getGraduationColor } from '@/lib/graduation';
import { exportLocalData, importLocalData } from '@/lib/localStore';
import { getDataSource } from '@/lib/dataSource';
import { parseRawEquipments, convertToEquipmentList } from '@/lib/equipmentParser';
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
  TuningAssistantReport,
  QRCodeAuthModal,
  SelectRoleModal,
  DPSGraduationPanel,
} from '@/components';
import {
  LogIn, LogOut, Share2, RefreshCw, Trash2, Download, Upload, Bot,
  Check, User, ChevronDown, ArrowUpDown, Plus
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
        toast.error('登录已过期，请重新扫码登录');
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
        equipments: equipments,
        rolePanelData: rolePanelData,
        createdAt: new Date().toISOString()
      };
      const { id: shareId } = await ds.createShare(snapshot);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
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

  const handleQRCodeAuthSuccess = (cookies: any, loginToken: string, roles: GameRole[]) => {
    saveAuthCredentials(cookies, loginToken, roles);
    setShowQRCodeAuth(false);
    setShowSelectRoleModal(true);
  };

  const handleSelectCharacter = (character: Character) => {
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

      toast.success(
        equipmentsList.length > 0
          ? `角色绑定成功！已加载 ${equipmentsList.length} 件装备`
          : '角色绑定成功！'
      );
    } catch (error) {
      console.error('创建角色失败:', error);
      clearAuthCredentials();
      setShowQRCodeAuth(true);
      toast.error('登录已过期，请重新扫码登录');
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

  const currentGraduation = graduationResults.find(r => r.plan_id === selectedPlan?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4 mx-auto" />
          <p className="text-muted-foreground">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          燕云十六声装备毕业率管理器
        </h1>
        <Button variant="outline" onClick={() => setShowAboutModal(true)}>
          关于本网站
        </Button>
      </header>

      {/* Auth & Character Bar */}
      <Card className="mb-6">
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
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400" />
                  创建角色中...
                </div>
              )}

              {selectedCharacter && (
                <>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="flex items-center gap-3">
                    {selectedCharacter.icon && (
                      <img
                        src={selectedCharacter.icon}
                        alt={selectedCharacter.name}
                        className="w-12 h-12 rounded-full border-2 border-primary"
                      />
                    )}
                    <div>
                      <div className="font-medium">{selectedCharacter.name}</div>
                      {selectedCharacter.level && (
                        <div className="text-sm text-muted-foreground">等级 {selectedCharacter.level}</div>
                      )}
                      {selectedCharacter.server_name && (
                        <div className="text-sm text-muted-foreground">{selectedCharacter.server_name}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSelectRoleModal(true)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      title="切换角色"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto max-sm:w-full max-sm:mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareCharacter}
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Share2 className="w-4 h-4 mr-1.5" />分享角色
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing || !authCredentials}
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? '刷新中...' : '刷新数据'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRCodeAuth(true)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />退出账号
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteCharacter}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />删除角色
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportModal(true)}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Download className="w-4 h-4 mr-1.5" />导出/导入
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowTuningAssistant(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Equipment Grid */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
              {['可用', '全部', '穿着'].map(filter => (
                <Button
                  key={filter}
                  variant={equipmentFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEquipmentFilter(filter as any)}
                >
                  {filter}
                </Button>
              ))}

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {EQUIPMENT_SLOTS.map(slot => (
                <Button
                  key={slot}
                  variant={slotFilter === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSlotFilter(slot)}
                >
                  {slot}
                </Button>
              ))}

              <Button
                variant={slotFilter === '全部' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSlotFilter('全部')}
              >
                全部
              </Button>
            </div>

            {/* Equipment Cards */}
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

          {/* Right: Panel + DPS */}
          <div className="space-y-4">
            {/* Character Stats Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">角色属性</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRolePanel ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-2" />
                    <span className="text-muted-foreground text-sm">加载中...</span>
                  </div>
                ) : rolePanelData ? (
                  <div className="space-y-3">
                    {/* 心法 */}
                    {(() => {
                      const xinfaSource = rolePanelData?.['combat_plan.xinfa_info'] ?? rolePanelData?.xinfa_info;
                      if (!xinfaSource || typeof xinfaSource !== 'object') return null;
                      return (
                        <div className="bg-surface-section rounded-lg p-2">
                          <div className="text-sm font-medium mb-1.5 text-data-xinfa">心法</div>
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
                                      <span key={i} className={`w-1 h-1 rounded-full ${i < rank ? 'bg-yellow-400' : 'bg-white/20'}`} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 三率属性 */}
                    <div className="bg-surface-section rounded-lg p-2">
                      <div className="text-sm font-medium mb-1 text-data-rate">三率属性</div>
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
                            <span className="text-xs text-muted-foreground">{label as string}</span>
                            <span className={`text-sm font-medium ${highlight ? 'text-primary' : ''}`}>{value as string}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 攻击属性 */}
                    <div className="bg-surface-section rounded-lg p-2">
                      <div className="text-sm font-medium mb-1 text-data-attack">攻击属性</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {[
                          { label: '最小外功', value: rolePanelData.MIN_W_ATK },
                          { label: '最大外功', value: rolePanelData.MAX_W_ATK },
                          { label: '最小鸣金', value: rolePanelData.MIN_PRO_ATK_A },
                          { label: '最大鸣金', value: rolePanelData.MAX_PRO_ATK_A },
                          { label: '最小牵丝', value: rolePanelData.MIN_PRO_ATK_B },
                          { label: '最大牵丝', value: rolePanelData.MAX_PRO_ATK_B },
                          { label: '最小裂石', value: rolePanelData.MIN_PRO_ATK_C },
                          { label: '最大裂石', value: rolePanelData.MAX_PRO_ATK_C },
                          { label: '最小破竹', value: rolePanelData.MIN_PRO_ATK_E },
                          { label: '最大破竹', value: rolePanelData.MAX_PRO_ATK_E },
                          { label: '最小无相', value: rolePanelData.MIN_ACTIVE_PRO_ATK },
                          { label: '最大无相', value: rolePanelData.MAX_ACTIVE_PRO_ATK },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-center gap-1">
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 防御属性 */}
                    <div className="bg-surface-section rounded-lg p-2">
                      <div className="text-sm font-medium mb-1 text-data-defense">防御属性</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {[
                          ['外攻防御', rolePanelData.W_DEF],
                          ['气血最大值', rolePanelData.hpMax],
                        ].map(([label, value]) => (
                          <div key={label as string} className="flex justify-between items-center gap-1">
                            <span className="text-xs text-muted-foreground">{label as string}</span>
                            <span className="text-sm font-medium">{value as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">暂无角色面板数据</p>
                    <p className="text-xs mt-1">选择角色后自动获取</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <DPSGraduationPanel
              rolePanelData={rolePanelData}
              selectedPlan={selectedPlan}
              equipments={equipments}
              xinfaNameMap={Object.fromEntries(Object.entries(configData?.xinfa_data || {}).map(([k, v]) => [k, v.name]))}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl text-muted-foreground mb-4">欢迎使用燕云十六声装备毕业率管理器</h2>
          <p className="text-muted-foreground/70 mb-6">
            {!authCredentials
              ? '请先扫码登录并选择角色开始使用'
              : '请从上方选择游戏角色开始使用'}
          </p>
          {!authCredentials && (
            <Button onClick={() => setShowQRCodeAuth(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <LogIn className="w-4 h-4 mr-2" />扫码登录
            </Button>
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

      {showTuningAssistant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 modal-enter max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">大神AI调号助手</h2>
              <Button variant="outline" onClick={() => setShowTuningAssistant(false)}>
                关闭
              </Button>
            </div>
            <TuningAssistantReport equipments={equipments} plan={selectedPlan} rolePanelData={rolePanelData} xinfaNameMap={Object.fromEntries(Object.entries(configData?.xinfa_data || {}).map(([k, v]) => [k, v.name]))} />
          </div>
        </div>
      )}
    </div>
  );
}
