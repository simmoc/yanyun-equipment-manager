import type { Character, Plan, Equipment } from '@/types';
import * as localStore from '@/lib/localStore';

interface DataSource {
  getCharacters(): Promise<Character[]>;
  createCharacter(name: string, options?: {
    icon?: string; level?: string; server_name?: string; role_id?: string; server?: string;
  }): Promise<Character>;
  deleteCharacter(characterId: string): Promise<void>;

  getPlans(characterId: string): Promise<Plan[]>;
  createPlan(characterId: string, plan: Omit<Plan, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Plan>;
  updatePlan(planId: string, updates: Partial<Plan>): Promise<void>;
  deletePlan(planId: string): Promise<void>;

  getEquipments(characterId: string): Promise<Equipment[]>;
  createEquipment(characterId: string, equipment: Omit<Equipment, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Equipment>;
  updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<void>;
  deleteEquipment(equipmentId: string): Promise<void>;

  exportData(): Promise<object>;
  importData(data: object): Promise<void>;

  createShare(snapshot: object): Promise<{ id: string }>;
}

class LocalDataSource implements DataSource {
  async getCharacters(): Promise<Character[]> {
    return localStore.getCharactersLocal();
  }

  async createCharacter(name: string, options?: {
    icon?: string; level?: string; server_name?: string; role_id?: string; server?: string;
  }): Promise<Character> {
    return localStore.createCharacterLocal(name, options);
  }

  async deleteCharacter(characterId: string): Promise<void> {
    return localStore.deleteCharacterLocal(characterId);
  }

  async getPlans(characterId: string): Promise<Plan[]> {
    return localStore.getPlansByCharacterIdLocal(characterId);
  }

  async createPlan(characterId: string, plan: Omit<Plan, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    return localStore.createPlanLocal(characterId, plan.name, plan.flow_type, plan.version, plan.flow_category, plan.bow_type, plan.suit_type, plan.loan_dingyin);
  }

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<void> {
    await localStore.updatePlanLocal(planId, updates);
  }

  async deletePlan(planId: string): Promise<void> {
    await localStore.deletePlanLocal(planId);
  }

  async getEquipments(characterId: string): Promise<Equipment[]> {
    return localStore.getEquipmentsByCharacterIdLocal(characterId);
  }

  async createEquipment(characterId: string, equipment: Omit<Equipment, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    return localStore.createEquipmentLocal(characterId, equipment.slot, equipment.name, equipment.level, equipment.attributes, equipment.is_wearing, equipment.suit_type as string | undefined);
  }

  async updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<void> {
    await localStore.updateEquipmentLocal(equipmentId, updates);
  }

  async deleteEquipment(equipmentId: string): Promise<void> {
    return localStore.deleteEquipmentLocal(equipmentId);
  }

  async exportData(): Promise<object> {
    return localStore.exportLocalData();
  }

  async importData(data: object): Promise<void> {
    localStore.importLocalData(data as Parameters<typeof localStore.importLocalData>[0]);
  }

  async createShare(snapshot: object): Promise<{ id: string }> {
    return localStore.createShareLocal(snapshot);
  }
}

class ApiDataSource implements DataSource {
  async getCharacters(): Promise<Character[]> {
    let uuid: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const authStr = localStorage.getItem('auth_credentials');
        if (authStr) {
          const auth = JSON.parse(authStr);
          uuid = auth.cookies?.godUuid;
        }
        if (!uuid) {
          const cacheStr = localStorage.getItem('qrcode_auth_cache');
          if (cacheStr) {
            const cache = JSON.parse(cacheStr);
            uuid = cache.cookies?.godUuid;
          }
        }
      } catch {}
    }
    const url = uuid ? `/api/characters?uuid=${encodeURIComponent(uuid)}` : '/api/characters';
    const response = await fetch(url);
    const data = await response.json();
    if (!data.success) throw new Error('Failed to fetch characters');
    return data.characters;
  }

  async createCharacter(name: string, options?: {
    icon?: string; level?: string; server_name?: string; role_id?: string; server?: string;
  }): Promise<Character> {
    let uuid: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const authStr = localStorage.getItem('auth_credentials');
        if (authStr) {
          const auth = JSON.parse(authStr);
          uuid = auth.cookies?.godUuid;
        }
        if (!uuid) {
          const cacheStr = localStorage.getItem('qrcode_auth_cache');
          if (cacheStr) {
            const cache = JSON.parse(cacheStr);
            uuid = cache.cookies?.godUuid;
          }
        }
      } catch {}
    }
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...options, uuid })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to create character');
    return data.character;
  }

  async deleteCharacter(characterId: string): Promise<void> {
    const response = await fetch('/api/characters', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to delete character');
  }

  async getPlans(characterId: string): Promise<Plan[]> {
    const response = await fetch(`/api/plans?characterId=${characterId}`);
    const data = await response.json();
    if (!data.success) throw new Error('Failed to fetch plans');
    return data.plans;
  }

  async createPlan(characterId: string, plan: Omit<Plan, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Plan> {
    const response = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, ...plan })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to create plan');
    return data.plan;
  }

  async updatePlan(planId: string, updates: Partial<Plan>): Promise<void> {
    const response = await fetch('/api/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, updates })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to update plan');
  }

  async deletePlan(planId: string): Promise<void> {
    const response = await fetch('/api/plans', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to delete plan');
  }

  async getEquipments(characterId: string): Promise<Equipment[]> {
    return localStore.getEquipmentsByCharacterIdLocal(characterId);
  }

  async createEquipment(characterId: string, equipment: Omit<Equipment, 'id' | 'character_id' | 'created_at' | 'updated_at'>): Promise<Equipment> {
    return localStore.createEquipmentLocal(characterId, equipment.slot, equipment.name, equipment.level, equipment.attributes, equipment.is_wearing, equipment.suit_type as string | undefined);
  }

  async updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<void> {
    await localStore.updateEquipmentLocal(equipmentId, updates);
  }

  async deleteEquipment(equipmentId: string): Promise<void> {
    return localStore.deleteEquipmentLocal(equipmentId);
  }

  async exportData(): Promise<object> {
    const response = await fetch('/api/export');
    const data = await response.json();
    if (!data.success) throw new Error('Failed to export data');
    return data.data;
  }

  async importData(data: object): Promise<void> {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    const result = await response.json();
    if (!result.success) throw new Error('Failed to import data');
  }

  async createShare(snapshot: object): Promise<{ id: string }> {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot })
    });
    const data = await response.json();
    if (!data.success) throw new Error('Failed to create share');
    return { id: data.shareId };
  }
}

let dataSource: DataSource | null = null;

export function initDataSource(isLocal: boolean): DataSource {
  if (isLocal) {
    dataSource = new LocalDataSource();
  } else {
    dataSource = new ApiDataSource();
  }
  return dataSource;
}

export function getDataSource(): DataSource {
  if (!dataSource) {
    throw new Error('DataSource not initialized. Call initDataSource first.');
  }
  return dataSource;
}

export function isLocalMode(): boolean {
  return dataSource instanceof LocalDataSource;
}

export type { DataSource };
