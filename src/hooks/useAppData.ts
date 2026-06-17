import { useState, useEffect } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { initLocalDatabase } from '@/lib/localStore';
import { initDataSource, getDataSource, isLocalMode } from '@/lib/dataSource';
import type { Character, Plan, Equipment, GameRole, AuthCredentials, RolePanelData } from '@/types';
import { log } from 'console';

// 临时定义 RoleInfo 类型，或者我们可以从 types 中导入
type RoleInfo = { [key: string]: any };

export function useAppData() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
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
      const chars = await ds.getCharacters('', fingerprint);
      setCharacters(chars);
      if (chars.length > 0 && !selectedCharacter) {
        const savedId = localStorage.getItem('selected_character_id');
        const savedChar = savedId ? chars.find(c => c.id === savedId) : null;
        setSelectedCharacter(savedChar || chars[0]);
      }
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  const fetchPlansAndEquipments = async () => {
    if (!selectedCharacter) return;
    try {
      const ds = getDataSource();
      const planList = await ds.getPlans(selectedCharacter.id);
      const equipList = await ds.getEquipments(selectedCharacter.id);
      setPlans(planList);
      setEquipments(equipList);
      if (planList.length > 0 && !selectedPlan) {
        setSelectedPlan(planList[0]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const initLocalAuth = async (fp: string) => {
    setLocalUserId('local-user-' + fp.slice(0, 8));
    await fetchCharacters();
  };

  // 保存登录凭证
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

  // 加载保存的登录凭证
  const loadAuthCredentials = () => {
    try {
      const saved = localStorage.getItem('auth_credentials');
      if (saved) {
        const credentials: AuthCredentials = JSON.parse(saved);
        const now = Date.now();
        // 24小时内有效
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

  // 获取角色面板数据（包括心法数据整合）
  const fetchRolePanel = async (character: Character) => {
    setIsLoadingRolePanel(true);
    try {
      // 从 localStorage 读取完整的 auth data
      const authDataStr = localStorage.getItem(`auth_${character.id}`);
      let authData: any = null;
      if (authDataStr) {
     
        authData = JSON.parse(authDataStr);
      }

      // 准备整合的数据
      let panelData: RolePanelData | null = null;
      let hasXinfaData = false;

      // 优先级1：尝试从 rolePanelData 读取
      if (authData?.rolePanelData) {
        panelData = authData.rolePanelData;
        console.log(panelData);
        // 检查是否已有心法数据
        if (panelData['combat_plan.xinfa_info'] || panelData.xinfa_info) {
          hasXinfaData = true;
        }
      }

      // 优先级2：如果没有心法数据，尝试从 roleInfo 中获取并合并
      if (!hasXinfaData && authData?.roleInfo) {
        if (!panelData) {
          panelData = {} as RolePanelData;
        }

        
        // 合并心法数据
        if (authData.roleInfo['combat_plan.xinfa_info']) {
          panelData['combat_plan.xinfa_info'] = authData.roleInfo['combat_plan.xinfa_info'];
        } else if (authData.roleInfo.xinfa_info) {
          panelData['combat_plan.xinfa_info'] = authData.roleInfo.xinfa_info;
        }
        
        // 同时也可以合并其他有用的属性
        if (authData.roleInfo['base.nickname']) {
          panelData['base.nickname'] = authData.roleInfo['base.nickname'];
        }
        if (authData.roleInfo['base.level']) {
          panelData['base.level'] = authData.roleInfo['base.level'];
        }
        hasXinfaData = true;
      }

      // 优先级3：如果本地没有完整的数据，或者没有心法数据，且有凭证，请求 API
      if ((!panelData || !hasXinfaData) && character.role_id && character.server && authCredentials) {
        const response = await fetch('/api/auth/role-panel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            server: character.server,
            roleId: character.role_id,
            cookies: authCredentials.cookies,
            loginToken: authCredentials.loginToken
          })
        });

        const apiData = await response.json();
        if (apiData.success && apiData.data) {
          panelData = apiData.data;
          
          // 如果 API 返回没有心法数据，但我们有本地的 roleInfo，再次尝试合并
          if (!panelData['combat_plan.xinfa_info'] && !panelData.xinfa_info && authData?.roleInfo) {
            if (authData.roleInfo['combat_plan.xinfa_info']) {
              panelData['combat_plan.xinfa_info'] = authData.roleInfo['combat_plan.xinfa_info'];
            } else if (authData.roleInfo.xinfa_info) {
              panelData['combat_plan.xinfa_info'] = authData.roleInfo.xinfa_info;
            }
          }
          
          // 更新保存到 localStorage
          if (authDataStr) {
            const savedAuthData = JSON.parse(authDataStr);
            savedAuthData.rolePanelData = panelData;
            localStorage.setItem(`auth_${character.id}`, JSON.stringify(savedAuthData));
          }
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
        
        // 加载保存的登录凭证
        loadAuthCredentials();
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
    fetchPlansAndEquipments();
  }, [selectedCharacter]);

  // 持久化当前选中的角色 ID
  useEffect(() => {
    if (selectedCharacter) {
      localStorage.setItem('selected_character_id', selectedCharacter.id);
    } else {
      localStorage.removeItem('selected_character_id');
    }
  }, [selectedCharacter]);

  return {
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
  };
}