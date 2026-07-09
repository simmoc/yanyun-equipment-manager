import { useState, useEffect, useCallback } from 'react';
import { initLocalDatabase, getNamespacedKey } from '@/lib/localStore';
import { initDataSource, getDataSource } from '@/lib/dataSource';
import { getEquipmentsFromAuthCache, parseRawEquipments, convertToEquipmentList } from '@/lib/equipmentParser';
import { ensureConfigData, getConfigData } from '@/lib/configStore';
import { fetchNetEaseRoleInfo, fetchNetEaseRolePanel, fetchNetEaseRoles } from '@/lib/neteaseClient';
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
  const [pendingRoleSelector, setPendingRoleSelector] = useState(false);

  const hasUnresolvedEquipmentText = (equipmentList: Equipment[]) => {
    return equipmentList.some(equipment =>
      /^装备\d+$/.test(equipment.name) ||
      /^套装\d+$/.test(equipment.suit_type || '') ||
      equipment.attributes?.some(attr => /^词条\d+$/.test(attr.name))
    );
  };

  const loadConfigForEquipment = async () => {
    try {
      return await ensureConfigData();
    } catch (error) {
      console.error('加载配置数据失败，使用当前缓存配置:', error);
      return getConfigData();
    }
  };

  const normalizeEquipmentAttributes = (equipment: Equipment) => {
    return (equipment.attributes || [])
      .map(attr => ({
        name: attr.name,
        value: attr.value,
        is_main: !!attr.is_main,
        rate: attr.rate ?? null,
        quality: attr.quality ?? null,
        affixId: attr.affixId ?? null
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  };

  const getEquipmentSignature = (equipment: Equipment) => {
    return JSON.stringify({
      slot: equipment.slot,
      name: equipment.name,
      level: equipment.level || 0,
      suit_type: equipment.suit_type || null,
      attributes: normalizeEquipmentAttributes(equipment)
    });
  };

  const mergeImportedWithHistory = (importedEquipments: Equipment[], savedEquipments: Equipment[]) => {
    const importedSignatures = new Set(importedEquipments.map(getEquipmentSignature));
    const history = savedEquipments
      .filter(equipment => !importedSignatures.has(getEquipmentSignature(equipment)))
      .map(equipment => ({ ...equipment, is_wearing: false }));

    return [
      ...importedEquipments.map(equipment => ({ ...equipment, is_wearing: true })),
      ...history
    ];
  };

  const updateEquipmentInDb = async (equipmentId: string, updates: Partial<Equipment>) => {
    const response = await fetch('/api/equipments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId, updates })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to update equipment in database');
  };

  const createEquipmentInDb = async (characterId: string, equipment: Equipment) => {
    const response = await fetch('/api/equipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterId,
        slot: equipment.slot,
        name: equipment.name,
        level: equipment.level,
        attributes: equipment.attributes,
        is_wearing: equipment.is_wearing,
        suit_type: equipment.suit_type,
        retone: equipment.retone,
        legacyTs: equipment.legacyTs
      })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to create equipment in database');
  };

  const syncEquipmentsToDatabase = async (characterId: string, localEquipments: Equipment[]) => {
    if (isLocal) return;

    try {
      const response = await fetch(`/api/equipments?characterId=${encodeURIComponent(characterId)}`);
      const data = await response.json();
      if (!data.success || !Array.isArray(data.equipments)) return;

      const dbEquipments = data.equipments.map((equipment: any) => ({
        ...equipment,
        legacyTs: equipment.legacyTs ?? equipment.legacy_ts,
        created_at: new Date(equipment.created_at),
        updated_at: new Date(equipment.updated_at)
      })) as Equipment[];

      const dbBySignature = new Map<string, Equipment[]>();
      for (const equipment of dbEquipments) {
        const signature = getEquipmentSignature(equipment);
        const queue = dbBySignature.get(signature) || [];
        queue.push(equipment);
        dbBySignature.set(signature, queue);
      }

      const usedDbIds = new Set<string>();
      for (const equipment of localEquipments) {
        const signature = getEquipmentSignature(equipment);
        const matched = dbBySignature.get(signature)?.find(item => !usedDbIds.has(item.id));
        const updates: Partial<Equipment> = {
          slot: equipment.slot,
          name: equipment.name,
          level: equipment.level,
          attributes: equipment.attributes,
          is_wearing: equipment.is_wearing,
          suit_type: equipment.suit_type,
          retone: equipment.retone,
          legacyTs: equipment.legacyTs
        };

        if (matched) {
          usedDbIds.add(matched.id);
          await updateEquipmentInDb(matched.id, updates);
        } else {
          await createEquipmentInDb(characterId, equipment);
        }
      }

      for (const equipment of dbEquipments) {
        if (!usedDbIds.has(equipment.id) && equipment.is_wearing) {
          await updateEquipmentInDb(equipment.id, { is_wearing: false });
        }
      }
    } catch (error) {
      console.error('同步装备到数据库失败:', error);
    }
  };

  const syncImportedEquipments = useCallback(async (
    characterId: string,
    importedEquipments: Equipment[],
    savedEquipments?: Equipment[]
  ): Promise<Equipment[]> => {
    const ds = getDataSource();
    const existingEquipments = savedEquipments ?? await ds.getEquipments(characterId);
    const existingBySignature = new Map<string, Equipment[]>();

    for (const equipment of existingEquipments) {
      const signature = getEquipmentSignature(equipment);
      const queue = existingBySignature.get(signature) || [];
      queue.push(equipment);
      existingBySignature.set(signature, queue);
    }

    const matchedExistingIds = new Set<string>();
    for (const importedEquipment of importedEquipments) {
      const signature = getEquipmentSignature(importedEquipment);
      const matched = existingBySignature.get(signature)?.find(item => !matchedExistingIds.has(item.id));
      const updates: Partial<Equipment> = {
        slot: importedEquipment.slot,
        name: importedEquipment.name,
        level: importedEquipment.level,
        attributes: importedEquipment.attributes,
        is_wearing: true,
        suit_type: importedEquipment.suit_type,
        retone: importedEquipment.retone,
        legacyTs: importedEquipment.legacyTs
      };

      if (matched) {
        matchedExistingIds.add(matched.id);
        await ds.updateEquipment(matched.id, updates);
      } else {
        const created = await ds.createEquipment(characterId, {
          slot: importedEquipment.slot,
          name: importedEquipment.name,
          level: importedEquipment.level,
          attributes: importedEquipment.attributes,
          is_wearing: true,
          suit_type: importedEquipment.suit_type,
          retone: importedEquipment.retone,
          legacyTs: importedEquipment.legacyTs
        });
        matchedExistingIds.add(created.id);
      }
    }

    for (const equipment of existingEquipments) {
      if (!matchedExistingIds.has(equipment.id) && equipment.is_wearing) {
        await ds.updateEquipment(equipment.id, { is_wearing: false });
      }
    }

    const syncedEquipments = await ds.getEquipments(characterId);
    await syncEquipmentsToDatabase(characterId, syncedEquipments);
    return syncedEquipments;
  }, [isLocal]);

  const fetchCharacters = async (): Promise<Character[]> => {
    try {
      const ds = getDataSource();
      const chars = await ds.getCharacters();
      setCharacters(chars);
      if (chars.length > 0 && !selectedCharacter) {
        const savedId = localStorage.getItem(getNamespacedKey('selected_character_id'));
        const savedChar = savedId ? chars.find(c => c.id === savedId) : null;
        setSelectedCharacter(savedChar || chars[0]);
      }
      return chars;
    } catch (error) {
      console.error('获取角色失败:', error);
      return [];
    }
  };

  const fetchPlansAndEquipments = useCallback(async () => {
    if (!selectedCharacter) return;

    const loadSavedEquipments = async () => {
      try {
        const ds = getDataSource();
        return await ds.getEquipments(selectedCharacter.id);
      } catch (error) {
        console.error('获取装备失败:', error);
        return [];
      }
    };

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

    const roleId = selectedCharacter.role_id;
    if (!roleId) {
      setEquipments(await loadSavedEquipments());
      return;
    }

    const server = selectedCharacter.server;

    // 先展示已解析缓存，避免刷新页面时被大配置文件加载阻塞。
    const cached = getEquipmentsFromAuthCache(roleId, selectedCharacter.id);
    const savedEquipments = await loadSavedEquipments();
    const hasReadyCache = cached && !hasUnresolvedEquipmentText(cached);
    if (hasReadyCache) {
      setEquipments(mergeImportedWithHistory(cached, savedEquipments));
      if (!authCredentials || !server) {
        const synced = await syncImportedEquipments(selectedCharacter.id, cached, savedEquipments);
        setEquipments(synced);
        return;
      }
    }

    // 有登录凭证时从API重新获取角色信息
    if (authCredentials && roleId && server) {
      try {
        const configData = await loadConfigForEquipment();
        if (!configData) throw new Error('Config data not available');

        const result = await fetchNetEaseRoleInfo({
          roleId,
          server,
          cookies: authCredentials.cookies,
          loginToken: authCredentials.loginToken
        });

        if (result.success && result.data?.roleInfo) {
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

          const synced = await syncImportedEquipments(selectedCharacter.id, equipmentsList, savedEquipments);
          setEquipments(synced);
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

    const authDataStr = localStorage.getItem(`auth_${roleId}`);
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        const cachedEquipments = Array.isArray(authData.equipments) ? authData.equipments : [];
        if (authData.roleInfo && (!cachedEquipments.length || hasUnresolvedEquipmentText(cachedEquipments))) {
          const configData = await loadConfigForEquipment();
          if (!configData) throw new Error('Config data not available');

          const rawEquips = parseRawEquipments(authData.roleInfo, configData);
          const equipmentsList = convertToEquipmentList(rawEquips);
          authData.equipments = equipmentsList;
          localStorage.setItem(`auth_${roleId}`, JSON.stringify(authData));
          const synced = await syncImportedEquipments(selectedCharacter.id, equipmentsList, savedEquipments);
          setEquipments(synced);
          return;
        }
      } catch (error) {
        console.error('修复装备缓存失败:', error);
      }
    }

    if (cached) {
      const synced = await syncImportedEquipments(selectedCharacter.id, cached, savedEquipments);
      setEquipments(synced);
      return;
    }

    // 最后尝试从本地存储读取
    setEquipments(savedEquipments);
  }, [selectedCharacter, authCredentials, selectedPlan, syncImportedEquipments]);

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
        const apiData = await fetchNetEaseRolePanel({
          server: character.server,
          roleId: character.role_id,
          cookies: authCredentials.cookies,
          loginToken: authCredentials.loginToken
        });
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
        const creds = loadAuthCredentials();

        let chars: Character[] = [];
        if (dbAvailable) {
          initDataSource(false);
          chars = await fetchCharacters();
        } else {
          await initLocalDatabase();
          initDataSource(true);
          setIsLocal(true);
          chars = await fetchCharacters();
        }

        if (creds && chars.length === 0) {
          try {
            const data = await fetchNetEaseRoles(creds.cookies, creds.loginToken);
            if (data.success) {
              setAvailableGameRoles(data.data.roles);
            }
          } catch (error) {
            console.error('获取角色列表失败，使用缓存的角色列表:', error);
          }
          setPendingRoleSelector(true);
        }
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
  }, [selectedCharacter, authCredentials]);

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
  };
}
