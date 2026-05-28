import { sql } from '@vercel/postgres';

const isDatabaseConfigured = !!process.env.DATABASE_URL;

export function isDbConfigured(): boolean {
  return isDatabaseConfigured;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!isDatabaseConfigured) return false;
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// 数据库初始化脚本
// 在 Neon PostgreSQL 中创建必要的表

export async function initDatabase() {
  try {
    // 创建用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fingerprint VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 创建角色表
    await sql`
      CREATE TABLE IF NOT EXISTS characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 创建方案表
    await sql`
      CREATE TABLE IF NOT EXISTS plans (
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
      );
    `;

    // 创建装备表
    await sql`
      CREATE TABLE IF NOT EXISTS equipments (
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
      );
    `;

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_plans_character ON plans(character_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_equipments_character ON equipments(character_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_equipments_slot ON equipments(slot);`;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error };
  }
}

// 用户相关操作
export async function getUserByFingerprint(fingerprint: string) {
  const result = await sql`
    SELECT * FROM users WHERE fingerprint = ${fingerprint}
  `;
  return result.rows[0] || null;
}

export async function createUser(fingerprint: string) {
  const result = await sql`
    INSERT INTO users (fingerprint) 
    VALUES (${fingerprint}) 
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateUserLogin(fingerprint: string) {
  await sql`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE fingerprint = ${fingerprint}
  `;
}

// 角色相关操作
export async function getCharactersByUserId(userId: string) {
  const result = await sql`
    SELECT * FROM characters WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function createCharacter(userId: string, name: string) {
  const result = await sql`
    INSERT INTO characters (user_id, name) 
    VALUES (${userId}, ${name}) 
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteCharacter(characterId: string) {
  await sql`DELETE FROM characters WHERE id = ${characterId}`;
}

// 方案相关操作
export async function getPlansByCharacterId(characterId: string) {
  const result = await sql`
    SELECT * FROM plans WHERE character_id = ${characterId} ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function createPlan(
  characterId: string,
  name: string,
  flowType: string,
  version: string,
  flowCategory: string,
  bowType: string,
  suitType: string,
  loanDingyin: boolean
) {
  const result = await sql`
    INSERT INTO plans (character_id, name, flow_type, version, flow_category, bow_type, suit_type, loan_dingyin)
    VALUES (${characterId}, ${name}, ${flowType}, ${version}, ${flowCategory}, ${bowType}, ${suitType}, ${loanDingyin})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updatePlan(
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
) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  let query = 'UPDATE plans SET updated_at = CURRENT_TIMESTAMP';
  fields.forEach((field, i) => {
    query += `, ${field} = '${values[i]}'`;
  });
  query += ` WHERE id = '${planId}' RETURNING *`;
  
  const result = await sql.query(query);
  return result.rows[0];
}

export async function deletePlan(planId: string) {
  await sql`DELETE FROM plans WHERE id = ${planId}`;
}

// 装备相关操作
export async function getEquipmentsByCharacterId(characterId: string) {
  const result = await sql`
    SELECT * FROM equipments WHERE character_id = ${characterId} ORDER BY slot, created_at DESC
  `;
  return result.rows;
}

export async function createEquipment(
  characterId: string,
  slot: string,
  name: string,
  level: number,
  attributes: object[],
  isWearing: boolean,
  suitType?: string
) {
  const result = await sql`
    INSERT INTO equipments (character_id, slot, name, level, attributes, is_wearing, suit_type)
    VALUES (${characterId}, ${slot}, ${name}, ${level}, ${JSON.stringify(attributes)}, ${isWearing}, ${suitType || null})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateEquipment(
  equipmentId: string,
  updates: {
    name?: string;
    level?: number;
    attributes?: object[];
    is_wearing?: boolean;
    suit_type?: string;
  }
) {
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
  
  const result = await sql.query(query);
  return result.rows[0];
}

export async function deleteEquipment(equipmentId: string) {
  await sql`DELETE FROM equipments WHERE id = ${equipmentId}`;
}