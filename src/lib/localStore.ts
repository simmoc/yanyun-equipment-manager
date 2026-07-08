import { v4 as uuidv4 } from 'uuid';
import type { Character, Plan, Equipment, EquipmentSlot, FlowType, VersionType, FlowCategory, BowType, SuitType } from '@/types';

const STORAGE_KEYS = {
  CHARACTERS: 'yanyun_characters',
  PLANS: 'yanyun_plans',
  EQUIPMENTS: 'yanyun_equipments',
  SHARES: 'yanyun_shares'
};

function generateId(): string {
  return uuidv4();
}

function getGodUuid(): string {
  if (typeof window === 'undefined') return '';
  try {
    const authStr = localStorage.getItem('auth_credentials');
    if (authStr) {
      const auth = JSON.parse(authStr);
      if (auth.cookies?.godUuid) return auth.cookies.godUuid;
    }
    const cacheStr = localStorage.getItem('qrcode_auth_cache');
    if (cacheStr) {
      const cache = JSON.parse(cacheStr);
      if (cache.cookies?.godUuid) return cache.cookies.godUuid;
    }
  } catch {}
  return '';
}

export function getNamespacedKey(key: string): string {
  const uid = getGodUuid();
  return uid ? `${key}_${uid}` : key;
}

function getKey(key: string): string {
  return getNamespacedKey(key);
}

function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getKey(key));
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getKey(key), JSON.stringify(data));
}

export interface LocalCharacter {
  id: string;
  name: string;
  icon?: string;
  level?: string;
  server_name?: string;
  role_id?: string;
  server?: string;
  uuid?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalPlan {
  id: string;
  character_id: string;
  name: string;
  flow_type: string;
  version: string;
  flow_category: string;
  bow_type: string;
  suit_type: string;
  loan_dingyin: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalEquipment {
  id: string;
  character_id: string;
  slot: string;
  name: string;
  level: number;
  attributes: object[];
  is_wearing: boolean;
  suit_type?: string;
  created_at: string;
  updated_at: string;
}

export async function initLocalDatabase() {
  if (typeof window === 'undefined') return { success: true };
  const characters = getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS);
  const plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  const equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  if (characters.length === 0) setItem(STORAGE_KEYS.CHARACTERS, []);
  if (plans.length === 0) setItem(STORAGE_KEYS.PLANS, []);
  if (equipments.length === 0) setItem(STORAGE_KEYS.EQUIPMENTS, []);
  return { success: true };
}

export async function getCharactersLocal(): Promise<Character[]> {
  const characters = getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS);
  const uid = getGodUuid();
  const filtered = uid ? characters.filter(c => c.uuid === uid) : characters;
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    level: c.level,
    server_name: c.server_name,
    role_id: c.role_id,
    server: c.server,
    uuid: c.uuid,
    created_at: new Date(c.created_at),
    updated_at: new Date(c.updated_at)
  } as Character));
}

export async function createCharacterLocal(
  name: string, 
  options?: {
    icon?: string;
    level?: string;
    server_name?: string;
    role_id?: string;
    server?: string;
  }
): Promise<Character> {
  const characters = getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS);
  const now = new Date().toISOString();
  const uid = getGodUuid();
  const newCharacter: LocalCharacter = {
    id: generateId(),
    name,
    icon: options?.icon,
    level: options?.level,
    server_name: options?.server_name,
    role_id: options?.role_id,
    server: options?.server,
    uuid: uid || undefined,
    created_at: now,
    updated_at: now
  };
  characters.push(newCharacter);
  setItem(STORAGE_KEYS.CHARACTERS, characters);
  return {
    id: newCharacter.id,
    name: newCharacter.name,
    icon: newCharacter.icon,
    level: newCharacter.level,
    server_name: newCharacter.server_name,
    role_id: newCharacter.role_id,
    server: newCharacter.server,
    uuid: newCharacter.uuid,
    created_at: new Date(newCharacter.created_at),
    updated_at: new Date(newCharacter.updated_at)
  } as Character;
}

export async function deleteCharacterLocal(characterId: string): Promise<void> {
  let characters = getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS);
  characters = characters.filter(c => c.id !== characterId);
  setItem(STORAGE_KEYS.CHARACTERS, characters);

  let plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  plans = plans.filter(p => p.character_id !== characterId);
  setItem(STORAGE_KEYS.PLANS, plans);

  let equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  equipments = equipments.filter(e => e.character_id !== characterId);
  setItem(STORAGE_KEYS.EQUIPMENTS, equipments);
}

export async function getCharacterByRoleIdLocal(roleId: string): Promise<Character | null> {
  const characters = getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS);
  const c = characters.find(ch => ch.role_id === roleId);
  if (!c) return null;
  return {
    id: c.id, name: c.name, icon: c.icon, level: c.level,
    server_name: c.server_name, role_id: c.role_id, server: c.server,
    uuid: c.uuid,
    created_at: new Date(c.created_at), updated_at: new Date(c.updated_at)
  } as Character;
}

export async function getPlansByCharacterIdLocal(characterId: string): Promise<Plan[]> {
  const plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  const filtered = plans.filter(p => p.character_id === characterId).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return filtered.map(p => ({
    id: p.id,
    character_id: p.character_id,
    name: p.name,
    flow_type: p.flow_type as FlowType,
    version: p.version as VersionType,
    flow_category: p.flow_category as FlowCategory,
    bow_type: p.bow_type as BowType,
    suit_type: p.suit_type as SuitType,
    loan_dingyin: p.loan_dingyin,
    created_at: new Date(p.created_at),
    updated_at: new Date(p.updated_at)
  } as Plan));
}

export async function createPlanLocal(
  characterId: string,
  name: string,
  flowType: string,
  version: string,
  flowCategory: string,
  bowType: string,
  suitType: string,
  loanDingyin: boolean
): Promise<Plan> {
  const plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  const now = new Date().toISOString();
  const newPlan: LocalPlan = {
    id: generateId(),
    character_id: characterId,
    name,
    flow_type: flowType,
    version,
    flow_category: flowCategory,
    bow_type: bowType,
    suit_type: suitType,
    loan_dingyin: loanDingyin,
    created_at: now,
    updated_at: now
  };
  plans.push(newPlan);
  setItem(STORAGE_KEYS.PLANS, plans);
  return {
    id: newPlan.id,
    character_id: newPlan.character_id,
    name: newPlan.name,
    flow_type: newPlan.flow_type as FlowType,
    version: newPlan.version as VersionType,
    flow_category: newPlan.flow_category as FlowCategory,
    bow_type: newPlan.bow_type as BowType,
    suit_type: newPlan.suit_type as SuitType,
    loan_dingyin: newPlan.loan_dingyin,
    created_at: new Date(newPlan.created_at),
    updated_at: new Date(newPlan.updated_at)
  } as Plan;
}

export async function updatePlanLocal(
  planId: string,
  updates: {
    name?: string;
    flow_type?: string;
    version?: string;
    flow_category?: string;
    bow_type?: string;
    suit_type?: string;
    loan_dingyin?: boolean;
  }
): Promise<Plan | null> {
  const plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  const planIndex = plans.findIndex(p => p.id === planId);
  if (planIndex === -1) return null;
  const plan = plans[planIndex];
  const updatedPlan = {
    ...plan,
    ...updates,
    updated_at: new Date().toISOString()
  };
  plans[planIndex] = updatedPlan;
  setItem(STORAGE_KEYS.PLANS, plans);
  return {
    id: updatedPlan.id,
    character_id: updatedPlan.character_id,
    name: updatedPlan.name,
    flow_type: updatedPlan.flow_type as FlowType,
    version: updatedPlan.version as VersionType,
    flow_category: updatedPlan.flow_category as FlowCategory,
    bow_type: updatedPlan.bow_type as BowType,
    suit_type: updatedPlan.suit_type as SuitType,
    loan_dingyin: updatedPlan.loan_dingyin,
    created_at: new Date(updatedPlan.created_at),
    updated_at: new Date(updatedPlan.updated_at)
  } as Plan;
}

export async function deletePlanLocal(planId: string): Promise<void> {
  let plans = getItem<LocalPlan>(STORAGE_KEYS.PLANS);
  plans = plans.filter(p => p.id !== planId);
  setItem(STORAGE_KEYS.PLANS, plans);
}

export async function getEquipmentsByCharacterIdLocal(characterId: string): Promise<Equipment[]> {
  const equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  const filtered = equipments.filter(e => e.character_id === characterId).sort((a, b) => {
    if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return filtered.map(e => ({
    id: e.id,
    character_id: e.character_id,
    slot: e.slot as EquipmentSlot,
    name: e.name,
    level: e.level,
    attributes: e.attributes as Equipment['attributes'],
    is_wearing: e.is_wearing,
    suit_type: e.suit_type as SuitType | undefined,
    created_at: new Date(e.created_at),
    updated_at: new Date(e.updated_at)
  } as Equipment));
}

export async function createEquipmentLocal(
  characterId: string,
  slot: string,
  name: string,
  level: number,
  attributes: object[],
  isWearing: boolean,
  suitType?: string
): Promise<Equipment> {
  const equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  const now = new Date().toISOString();
  const newEquipment: LocalEquipment = {
    id: generateId(),
    character_id: characterId,
    slot,
    name,
    level,
    attributes,
    is_wearing: isWearing,
    suit_type: suitType,
    created_at: now,
    updated_at: now
  };
  equipments.push(newEquipment);
  setItem(STORAGE_KEYS.EQUIPMENTS, equipments);
  return {
    id: newEquipment.id,
    character_id: newEquipment.character_id,
    slot: newEquipment.slot as EquipmentSlot,
    name: newEquipment.name,
    level: newEquipment.level,
    attributes: newEquipment.attributes as Equipment['attributes'],
    is_wearing: newEquipment.is_wearing,
    suit_type: newEquipment.suit_type as SuitType | undefined,
    created_at: new Date(newEquipment.created_at),
    updated_at: new Date(newEquipment.updated_at)
  } as Equipment;
}

export async function updateEquipmentLocal(
  equipmentId: string,
  updates: {
    slot?: string;
    name?: string;
    level?: number;
    attributes?: object[];
    is_wearing?: boolean;
    suit_type?: string;
  }
): Promise<Equipment | null> {
  const equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  const equipIndex = equipments.findIndex(e => e.id === equipmentId);
  if (equipIndex === -1) return null;
  const updatedEquipment = {
    ...equipments[equipIndex],
    ...updates,
    updated_at: new Date().toISOString()
  };
  equipments[equipIndex] = updatedEquipment;
  setItem(STORAGE_KEYS.EQUIPMENTS, equipments);
  return {
    id: updatedEquipment.id,
    character_id: updatedEquipment.character_id,
    slot: updatedEquipment.slot as EquipmentSlot,
    name: updatedEquipment.name,
    level: updatedEquipment.level,
    attributes: updatedEquipment.attributes as Equipment['attributes'],
    is_wearing: updatedEquipment.is_wearing,
    suit_type: updatedEquipment.suit_type as SuitType | undefined,
    created_at: new Date(updatedEquipment.created_at),
    updated_at: new Date(updatedEquipment.updated_at)
  } as Equipment;
}

export async function deleteEquipmentLocal(equipmentId: string): Promise<void> {
  let equipments = getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS);
  equipments = equipments.filter(e => e.id !== equipmentId);
  setItem(STORAGE_KEYS.EQUIPMENTS, equipments);
}

export function exportLocalData(): {
  characters: LocalCharacter[];
  plans: LocalPlan[];
  equipments: LocalEquipment[];
} {
  return {
    characters: getItem<LocalCharacter>(STORAGE_KEYS.CHARACTERS),
    plans: getItem<LocalPlan>(STORAGE_KEYS.PLANS),
    equipments: getItem<LocalEquipment>(STORAGE_KEYS.EQUIPMENTS)
  };
}

export function importLocalData(data: {
  characters?: LocalCharacter[];
  plans?: LocalPlan[];
  equipments?: LocalEquipment[];
}): void {
  if (data.characters) setItem(STORAGE_KEYS.CHARACTERS, data.characters);
  if (data.plans) setItem(STORAGE_KEYS.PLANS, data.plans);
  if (data.equipments) setItem(STORAGE_KEYS.EQUIPMENTS, data.equipments);
}

export function clearLocalData(): void {
  localStorage.removeItem(getKey(STORAGE_KEYS.CHARACTERS));
  localStorage.removeItem(getKey(STORAGE_KEYS.PLANS));
  localStorage.removeItem(getKey(STORAGE_KEYS.EQUIPMENTS));
  localStorage.removeItem(getKey(STORAGE_KEYS.SHARES));
}

// 分享存储
export interface LocalShare {
  id: string;
  snapshot: object;
  created_at: string;
}

export async function createShareLocal(snapshot: object): Promise<{ id: string }> {
  const shares = getItem<LocalShare>(STORAGE_KEYS.SHARES);
  const id = generateId();
  const share: LocalShare = {
    id,
    snapshot,
    created_at: new Date().toISOString()
  };
  shares.push(share);
  setItem(STORAGE_KEYS.SHARES, shares);
  return { id };
}

export async function getShareLocal(shareId: string): Promise<LocalShare | null> {
  const shares = getItem<LocalShare>(STORAGE_KEYS.SHARES);
  return shares.find(s => s.id === shareId) || null;
}
