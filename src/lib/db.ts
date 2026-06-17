import { neon } from '@neondatabase/serverless';

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

let _sql: ReturnType<typeof neon> | null = null;
let _initialized = false;

function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('Database not configured');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export async function ensureDb(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  await initDatabase();
}

function asRows<T = any>(result: any): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && Array.isArray(result.rows)) return result.rows as T[];
  return [];
}

function asRow<T = any>(result: any): T | null {
  const rows = asRows<T>(result);
  return rows[0] || null;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const db = getSql();
    await db`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function initDatabase() {
  try {
    const db = getSql();
    await db`CREATE TABLE IF NOT EXISTS characters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      icon TEXT,
      level VARCHAR(50),
      server_name VARCHAR(100),
      role_id VARCHAR(100),
      uuid VARCHAR(100),
      server VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    await db`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'characters_role_id_key'
        ) THEN
          ALTER TABLE characters ADD CONSTRAINT characters_role_id_key UNIQUE (role_id);
        END IF;
      END;
    $$;
    `;

    await db`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'characters' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE characters DROP COLUMN user_id;
        END IF;
      END;
    $$;
    `;

    await db`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'characters' AND column_name = 'uuid'
        ) THEN
          ALTER TABLE characters ADD COLUMN uuid VARCHAR(100);
        END IF;
      END;
    $$;
    `;

    await db`CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      flow_type VARCHAR(50) NOT NULL,
      version VARCHAR(50) NOT NULL,
      flow_category VARCHAR(50) NOT NULL,
      bow_type VARCHAR(50) NOT NULL,
      suit_type VARCHAR(50) NOT NULL,
      loan_dingyin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    await db`CREATE TABLE IF NOT EXISTS equipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      slot VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      level INTEGER DEFAULT 0,
      attributes JSONB DEFAULT '[]',
      is_wearing BOOLEAN DEFAULT FALSE,
      suit_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    await db`CREATE TABLE IF NOT EXISTS shared_characters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      snapshot JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
    );`;

    await db`CREATE INDEX IF NOT EXISTS idx_plans_character ON plans(character_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_equipments_character ON equipments(character_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_equipments_slot ON equipments(slot);`;
    await db`CREATE INDEX IF NOT EXISTS idx_shared_characters_id ON shared_characters(id);`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}

export async function getCharacters() {
  const db = getSql();
  const result = await db`SELECT * FROM characters ORDER BY created_at DESC`;
  return asRows(result);
}

export async function getCharacterByRoleId(roleId: string) {
  const db = getSql();
  const result = await db`SELECT * FROM characters WHERE role_id = ${roleId}`;
  return asRow(result);
}

export async function createCharacter(name: string, options?: {
  icon?: string; level?: string; server_name?: string; role_id?: string; server?: string; uuid?: string;
}) {
  const db = getSql();
  const result = await db`
    INSERT INTO characters (name, icon, level, server_name, role_id, uuid, server)
    VALUES (${name}, ${options?.icon || null}, ${options?.level || null}, ${options?.server_name || null}, ${options?.role_id || null}, ${options?.uuid || null}, ${options?.server || null})
    ON CONFLICT (role_id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, level = EXCLUDED.level, server_name = EXCLUDED.server_name, uuid = EXCLUDED.uuid, server = EXCLUDED.server, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return asRow(result);
}

export async function getCharactersByUuid(uuid: string) {
  const db = getSql();
  const result = await db`SELECT * FROM characters WHERE uuid = ${uuid} ORDER BY created_at DESC`;
  return asRows(result);
}

export async function deleteCharacter(characterId: string) {
  const db = getSql();
  await db`DELETE FROM characters WHERE id = ${characterId}`;
}

export async function getPlansByCharacterId(characterId: string) {
  const db = getSql();
  const result = await db`SELECT * FROM plans WHERE character_id = ${characterId} ORDER BY created_at DESC`;
  return asRows(result);
}

export async function createPlan(characterId: string, name: string, flowType: string, version: string, flowCategory: string, bowType: string, suitType: string, loanDingyin: boolean) {
  const db = getSql();
  const result = await db`
    INSERT INTO plans (character_id, name, flow_type, version, flow_category, bow_type, suit_type, loan_dingyin)
    VALUES (${characterId}, ${name}, ${flowType}, ${version}, ${flowCategory}, ${bowType}, ${suitType}, ${loanDingyin})
    RETURNING *
  `;
  return asRow(result);
}

export async function updatePlan(planId: string, updates: Record<string, any>) {
  const db = getSql();
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  let query = 'UPDATE plans SET updated_at = CURRENT_TIMESTAMP';
  fields.forEach((field, i) => {
    query += `, ${field} = '${values[i]}'`;
  });
  query += ` WHERE id = '${planId}' RETURNING *`;
  const result = await db(query);
  return asRow(result);
}

export async function deletePlan(planId: string) {
  const db = getSql();
  await db`DELETE FROM plans WHERE id = ${planId}`;
}

export async function getEquipmentsByCharacterId(characterId: string) {
  const db = getSql();
  const result = await db`SELECT * FROM equipments WHERE character_id = ${characterId} ORDER BY slot, created_at DESC`;
  return asRows(result);
}

export async function createEquipment(characterId: string, slot: string, name: string, level: number, attributes: object[], isWearing: boolean, suitType?: string) {
  const db = getSql();
  const result = await db`
    INSERT INTO equipments (character_id, slot, name, level, attributes, is_wearing, suit_type)
    VALUES (${characterId}, ${slot}, ${name}, ${level}, ${JSON.stringify(attributes)}, ${isWearing}, ${suitType || null})
    RETURNING *
  `;
  return asRow(result);
}

export async function updateEquipment(equipmentId: string, updates: Record<string, any>) {
  const db = getSql();
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  let query = 'UPDATE equipments SET updated_at = CURRENT_TIMESTAMP';
  fields.forEach((field, i) => {
    if (field === 'attributes') {
      query += `, ${field} = '${JSON.stringify(values[i])}'`;
    } else {
      query += `, ${field} = '${values[i]}'`;
    }
  });
  query += ` WHERE id = '${equipmentId}' RETURNING *`;
  const result = await db(query);
  return asRow(result);
}

export async function deleteEquipment(equipmentId: string) {
  const db = getSql();
  await db`DELETE FROM equipments WHERE id = ${equipmentId}`;
}

export async function createShare(snapshot: object) {
  const db = getSql();
  const result = await db`INSERT INTO shared_characters (snapshot) VALUES (${JSON.stringify(snapshot)}) RETURNING id, created_at`;
  return asRow(result);
}

export async function getShare(shareId: string) {
  const db = getSql();
  const result = await db`SELECT * FROM shared_characters WHERE id = ${shareId} AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;
  return asRow(result);
}
