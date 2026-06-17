import { useState, useEffect, useCallback } from 'react';
import { initLocalDatabase, getNamespacedKey } from '@/lib/localStore';
import { initDataSource, getDataSource, isLocalMode } from '@/lib/dataSource';
import { getEquipmentsFromAuthCache, parseRawEquipments, convertToEquipmentList } from '@/lib/equipmentParser';
import { getConfigData } from '@/lib/configStore';
import type { Character, Plan, Equipment, GameRole, AuthCredentials, RolePanelData } from '@/types';

export function useAppData() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [authCredentials, setAuthCredentials] = useState<AuthCredentials | null>(null);
  const [availableGameRoles, setAvailableGameRoles] = useState<GameRole[]>([]);
  const [rolePanelData, setRolePanelData] = useState<RolePanelData | null>(null);
  const [isLoadingRolePanel, setIsLoadingRolePanel] = useState(false);

  const fetchCharacters = async () => {
    try {
      const ds = getDataSource();
      const chars = await ds.getCharacters();
      setCharacters(chars);
      if (chars.length > 0 && !selectedCharacter) {
        const savedId = localStorage.getItem(getNamespacedKey('selected_character_id'));
        const savedChar = savedId ? chars.find(c => c.id === savedId) : null;
        setSelectedCharacter(savedChar || chars[0]);
      }
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  const fetchPlansAndEquipments = useCallback(async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      const planList = await ds.getPlans(selectedCharacter.id);
      setPlans(planList);
      if (planList.length > 0 && !selectedPlan) {
        setSelectedPlan(planList[0]);
      }
    } catch (error) {
      console.error('获取方案失败:', error);
    }

    if (!selectedCharacter.role_id) return;

    const roleId = selectedCharacter.role_id;
    const server = selectedCharacter.server;

    // 有登录凭证时从API重新获取角色信息
    if (authCredentials && roleId && server) {
      try {
        const response = await fetch('/api/auth/role-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId,
            server,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        });
        const result = await response.json();

        if (result.success && result.data?.roleInfo) {
          const configData = getConfigData();
          const rawEquips = parseRawEquipments(result.data.roleInfo, configData);
          const equipmentsList = convertToEquipmentList(rawEquips);

          let authDataStr = localStorage.getItem(`auth_${roleId}`);
          if (!authDataStr && selectedCharacter.id) {
            authDataStr = localStorage.getItem(`auth_${selectedCharacter.id}`);
          }
          const authData = authDataStr ? JSON.parse(authDataStr) : {};
          authData.roleInfo = result.data.roleInfo;
          authData.reportToken = result.data.reportToken;
          authData.equipments = equipmentsList;
          localStorage.setItem(`auth_${roleId}`, JSON.stringify(authData));
          if (selectedCharacter.id && selectedCharacter.id !== roleId) {
            localStorage.removeItem(`auth_${selectedCharacter.id}`);
          }

          setEquipments(equipmentsList);
          return;
        }
      } catch (error) {
        console.error('刷新角色信息失败，尝试使用缓存:', error);
      }
    }

    // 无凭证或API失败时尝试迁移旧key并读缓存
    if (selectedCharacter.id && selectedCharacter.id !== roleId) {
      const oldData = localStorage.getItem(`auth_${selectedCharacter.id}`);
      if (oldData) {
        localStorage.setItem(`auth_${roleId}`, oldData);
        localStorage.removeItem(`auth_${selectedCharacter.id}`);
      }
    }
    const cached = getEquipmentsFromAuthCache(roleId);
    if (cached) {
      setEquipments(cached);
      return;
    }

    // 最后尝试从本地存储读取
    try {
      const ds = getDataSource();
      const equipList = await ds.getEquipments(selectedCharacter.id);
      setEquipments(equipList);
    } catch (error) {
      console.error('获取装备失败:', error);
    }
  }, [selectedCharacter, authCredentials, selectedPlan]);

  const saveAuthCredentials = (cookies: any, loginToken: string, roles: GameRole[]) => {
    const credentials: AuthCredentials = {
      cookies,
      loginToken,
      roles,
      timestamp: Date.now()
    };
    setAuthCredentials(credentials);
    setAvailableGameRoles(roles);
    localStorage.setItem('auth_credentials', JSON.stringify(credentials));
  };

  const clearAuthCredentials = () => {
    setAuthCredentials(null);
    setAvailableGameRoles([]);
    localStorage.removeItem('auth_credentials');
  };

  const loadAuthCredentials = () => {
    try {
      const saved = localStorage.getItem('auth_credentials');
      if (saved) {
        const credentials: AuthCredentials = JSON.parse(saved);
        const now = Date.now();
        if (now - credentials.timestamp < 24 * 60 * 60 * 1000) {
          setAuthCredentials(credentials);
          setAvailableGameRoles(credentials.roles);
          return credentials;
        }
      }
    } catch (error) {
      console.error('加载登录凭证失败:', error);
    }
    return null;
  };

  const fetchRolePanel = async (character: Character) => {
    setIsLoadingRolePanel(true);
    try {
      let authDataStr = localStorage.getItem(`auth_${character.role_id}`);
      if (!authDataStr && character.id) {
        authDataStr = localStorage.getItem(`auth_${character.id}`);
        if (authDataStr && character.role_id) {
          localStorage.setItem(`auth_${character.role_id}`, authDataStr);
          localStorage.removeItem(`auth_${character.id}`);
        }
      }
      let authData: any = null;
      if (authDataStr) {
        authData = JSON.parse(authDataStr);
      }

      let panelData: RolePanelData | null = null;
      let hasXinfaData = false;

      if (authData?.rolePanelData) {
        panelData = authData.rolePanelData;
        if (panelData['combat_plan.xinfa_info'] || panelData.xinfa_info) {
          hasXinfaData = true;
        }
      }

      if (!hasXinfaData && authData?.roleInfo) {
        if (!panelData) {
          panelData = {} as RolePanelData;
        }

        if (authData.roleInfo['combat_plan.xinfa_info']) {
          panelData['combat_plan.xinfa_info'] = authData.roleInfo['combat_plan.xinfa_info'];
        } else if (authData.roleInfo.xinfa_info) {
          panelData['combat_plan.xinfa_info'] = authData.roleInfo.xinfa_info;
        }

        if (authData.roleInfo['base.nickname']) {
          panelData['base.nickname'] = authData.roleInfo['base.nickname'];
        }
        if (authData.roleInfo['base.level']) {
          panelData['base.level'] = authData.roleInfo['base.level'];
        }
        hasXinfaData = true;
      }

      if ((!panelData || !hasXinfaData) && character.role_id && character.server && authCredentials) {
        const response = await fetch('/api/auth/role-panel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server: character.server,
            roleId: character.role_id,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        });

        const apiData = await response.json();
        if (apiData.needReauth) {
          console.error('登录已过期，清除凭证');
          clearAuthCredentials();
          return;
        }
        if (apiData.success && apiData.data) {
          panelData = apiData.data;

          if (!panelData['combat_plan.xinfa_info'] && !panelData.xinfa_info && authData?.roleInfo) {
            if (authData.roleInfo['combat_plan.xinfa_info']) {
              panelData['combat_plan.xinfa_info'] = authData.roleInfo['combat_plan.xinfa_info'];
            } else if (authData.roleInfo.xinfa_info) {
              panelData['combat_plan.xinfa_info'] = authData.roleInfo.xinfa_info;
            }
          }

          const savedAuthData = authDataStr ? JSON.parse(authDataStr) : {};
          savedAuthData.rolePanelData = panelData;
          localStorage.setItem(`auth_${character.role_id}`, JSON.stringify(savedAuthData));
        }
      }

      if (panelData) {
        setRolePanelData(panelData);
      }
    } catch (error) {
      console.error('获取角色面板数据失败:', error);
    } finally {
      setIsLoadingRolePanel(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const statusResponse = await fetch('/api/status');
        const statusData = await statusResponse.json();
        const dbAvailable = statusData.data?.databaseAvailable;

        if (dbAvailable) {
          initDataSource(false);
          await fetchCharacters();
        } else {
          await initLocalDatabase();
          initDataSource(true);
          setIsLocal(true);
          await fetchCharacters();
        }

        loadAuthCredentials();
      } catch (error) {
        console.error('初始化失败:', error);
        await initLocalDatabase();
        initDataSource(true);
        setIsLocal(true);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchPlansAndEquipments();
  }, [selectedCharacter]);

  useEffect(() => {
    if (selectedCharacter) {
      localStorage.setItem(getNamespacedKey('selected_character_id'), selectedCharacter.id);
    } else {
      localStorage.removeItem(getNamespacedKey('selected_character_id'));
    }
  }, [selectedCharacter]);

  return {
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
    fetchCharacters,
    fetchPlansAndEquipments,
    saveAuthCredentials,
    clearAuthCredentials,
    fetchRolePanel
  };
}
