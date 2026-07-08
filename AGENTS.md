# AGENTS.md

This file provides guidance to Lingma (lingma.aliyun.com) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js 14 dev server
npm run build    # next build (output: 'standalone')
npm run start    # Production server (must build first)
npm run lint     # next lint
npm run lint-fix # next lint --fix
```

No tests, no typecheck script (`strict: false` in tsconfig, `noEmit: true`).

**Local dev env**: Only `DATABASE_URL` is needed (the README documents `POSTGRES_*` vars but the code reads `DATABASE_URL`). Without it, the app runs in localStorage-only mode.

```bash
# .env.local
DATABASE_URL="postgresql://user:password@host/database"
```

**Config data sync**: Run `node tools/download-config.js` to pull latest `equip_data.json`, `suffix_data.json`, `affix_data.json` etc. from `s.166.net` CDN into `tools/config_data/`.

## Project overview

Single-page Next.js 14 App Router app (client component at `src/app/page.tsx`, ~792 lines) plus a standalone share page (`src/app/share/[id]/page.tsx`). Calculates equipment graduation rates for the game 燕云十六声 (Where Winds Meet).

Dual-mode data storage: **localStorage** (default when DB unavailable) or **Neon PostgreSQL** (or any standard PostgreSQL via `pg` Pool).
Mode auto-detected at init via `GET /api/status`. The client calls `initDataSource(isLocal)` from `src/lib/dataSource.ts`.

## Architecture

### Storage layers

```
UI (useAppData hook)
  ↕
DataSource interface (src/lib/dataSource.ts)
  ↕
┌──────────────────────┬────────────────────────┐
│ LocalDataSource      │ ApiDataSource           │
│ → localStore.ts      │ → fetch() to /api/*     │
│ localStorage (keys   │ → db.ts (Neon PG or     │
│   namespaced by      │   standard pg Pool)     │
│   godUuid)           │                         │
│                      │ EXCEPT: equipment CRUD  │
│                      │ always delegates to     │
│                      │ localStore.ts directly! │
└──────────────────────┴────────────────────────┘
```

**Critical**: Equipment data is **always stored locally** even in API/DB mode. `ApiDataSource.getEquipments()` / `createEquipment()` / `updateEquipment()` / `deleteEquipment()` all call `localStore` directly — they never hit the database. Only Characters, Plans, Export, and Share go through the DB. This means the `equipments` DB table exists but is only used by legacy code paths, not the current UI.

### DataSource interface

`src/lib/dataSource.ts` defines a `DataSource` interface with methods: `getCharacters`, `createCharacter`, `deleteCharacter`, `getPlans`, `createPlan`, `updatePlan`, `deletePlan`, `getEquipments`, `createEquipment`, `updateEquipment`, `deleteEquipment`, `exportData`, `importData`, `createShare`. Two implementations: `LocalDataSource` and `ApiDataSource`. Singleton accessed via `getDataSource()`.

### State management — hooks

- **`src/hooks/useAppData.ts`** (~374 lines): The **single state management hub** for the entire app. Holds all state: `characters`, `selectedCharacter`, `plans`, `selectedPlan`, `equipments`, `authCredentials`, `availableGameRoles`, `rolePanelData`. All CRUD mutations go through this hook. Components receive data and callbacks as props — there is no React Context or external state library.
- **`src/hooks/useConfigData.ts`** (~113 lines): Fetches and manages static config data (equipment definitions, suffix/affix names, flow config, rotations, skills, xinfa data) via `configStore.ts`. Provides helper functions like `getEquipImageUrl`.

### API routes (13 endpoints)

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/status` | GET | Check DB connectivity, returns `{ databaseAvailable, mode }` |
| `/api/init` | GET | Initialize DB tables (idempotent via `ensureDb()`) |
| `/api/config` | GET | Serve static config JSON from `tools/config_data/` |
| `/api/characters` | GET, POST, DELETE | CRUD characters, GET supports `?uuid=` filter |
| `/api/plans` | GET, POST, PUT, DELETE | CRUD build plans for a character |
| `/api/equipments` | GET, POST, PUT, DELETE | CRUD equipment (legacy DB path, UI uses localStore) |
| `/api/graduation` | GET | Graduation rate calculation endpoint |
| `/api/export` | GET, POST | Export/import all user data |
| `/api/share` | POST | Create shareable snapshot (30-day expiry) |
| `/api/auth/*` | POST, GET | QR login proxy to NetEase CC platform, role info fetch |
| `/api/captured` | GET | List captured game data snapshots |
| `/api/import-captured` | POST | Import a captured data snapshot |
| `/api/ai-transfer-tool` | GET | Proxy to fetch `ai_transfer_tool.json` from `s.166.net` CDN |

All API responses use `{ success: boolean, ... }` shape. Routes call `ensureDb()` before DB operations (idempotent).

### Component tree

```
RootLayout
└── Home (src/app/page.tsx) [client component, ~792 lines]
    ├── NewCharacterModal / NewPlanModal / NewEquipmentModal
    ├── EditEquipmentModal / ExportModal / AboutModal
    ├── ImportCapturedModal / QRCodeAuthModal / SelectRoleModal
    ├── EquipmentCard / PlanCard
    ├── TuningAssistantModal        (wraps TuningAssistantReport)
    ├── TuningAssistantReport      (~1638 lines, largest component)
    ├── DPSGraduationPanel         (~536 lines, DPS-based graduation)
    ├── Toast / Modal (reusable)
    └── ui/                        (12 shadcn/ui primitives: button, card,
                                   checkbox, select, tooltip, table, etc.)
Separate page:
└── SharePage (src/app/share/[id]/page.tsx)
```

All components barrel-exported from `src/components/index.ts`.

### Three graduation calculation systems

1. **Attribute-based** (`src/lib/graduation.ts`, ~157 lines): Weighted scoring per equipment slot against per-slot thresholds. Uses `FLOW_WEIGHTS` (per-flow-type attribute weights) and `SLOT_THRESHOLDS` (per-slot graduation thresholds). Served at `GET /api/graduation`.

2. **DPS-based** (`src/lib/dpsCalculator.ts` ~816 lines + `src/lib/dpsReferenceData.ts` ~1226 lines + `src/components/DPSGraduationPanel/`): A v4.0 DPS simulator verified against `base_excel/` spreadsheets (110阶9流派, 1115 rows, 0.00% error). Computes per-skill damage across 5 elements (外功/鸣金/裂石/牵丝/破竹) × 4 hit types (会心/会意/普通/擦伤), applies school-specific multipliers (B21 special, col31 for 鸣金), and derives graduation rate as `userDPS / referenceDPS`.

3. **Graduation Calculator** (`src/lib/graduationCalculator.ts`, ~643 lines): A comprehensive calculator that uses flow config data (`flow_config.json`, `flow_rotations.json`, `flow_skills.json` from `tools/config_data/`). Builds `PlayerStats` from equipment + role panel data, simulates skill rotations with dingyin/yishui/tiaozhan bonuses, and computes `GraduationCalcResult` with per-skill damage breakdowns. Used by `TuningAssistantReport` component.

### Auth system (two mechanisms)

1. **FingerprintJS** (`@fingerprintjs/fingerprintjs`): Browser fingerprint for anonymous user identification. Used as `uuid` parameter to associate characters with a device.
2. **NetEase CC QR Login**: Proxy-based QR code auth via `q.reg.163.com` (client logic in `src/lib/neteaseClient.ts`). Fetches actual game role data and equipment. Auth credentials cached in localStorage (`auth_credentials`, `qrcode_auth_cache`) and expire after 24h (timestamp check in `loadAuthCredentials`).

### Equipment import from game

`src/lib/equipmentParser.ts` (~185 lines) parses raw equipment data from NetEase's role-info API (`combat_plan.wear_equips`). Maps numeric slot IDs (1→主武器, 2→副武器, 3→冠胄, ...) via `slotMap`, resolves equipment names and affix names from config data (`equip_data.json`, `suffix_data.json`, `affix_data.json`), and converts to the app's `Equipment` type. Parsed equipment cached in localStorage key `auth_{roleId}`.

### Config data pipeline

`tools/download-config.js` downloads JSON config files from `s.166.net` CDN into `tools/config_data/`. These files are served by `GET /api/config` and loaded client-side via `src/lib/configStore.ts` (~30 lines, uses in-memory cache) and the `useConfigData` hook. Config includes equipment definitions, suffix/set names, affix definitions, school/xinfa reference data, flow config (rotations, skills, baselines) for DPS calculation.

### Database layer — `src/lib/db.ts` (~329 lines)

- **Dual driver support**: Auto-detects Neon databases (hostname ends with `.neon.tech`) and uses `@neondatabase/serverless`; otherwise falls back to standard `pg` Pool with configurable `POSTGRES_POOL_MAX` (default 3).
- **Parameterized queries**: All update operations use `updateById()` with `$1, $2, ...` parameter placeholders — SQL injection safe. JSON fields are serialized and cast with `::jsonb`.
- Tables: `characters`, `plans`, `equipments` (legacy, not used by UI), `shared_characters`.

### Database schema (Neon PostgreSQL)

- **characters**: `id UUID PK`, `name`, `icon`, `level`, `server_name`, `role_id` (UNIQUE), `uuid`, `server`, timestamps
- **plans**: `id UUID PK`, `character_id FK→characters ON DELETE CASCADE`, `name`, `flow_type`, `version`, `flow_category`, `bow_type`, `suit_type`, `loan_dingyin BOOLEAN`, timestamps
- **equipments**: `id UUID PK`, `character_id FK→characters ON DELETE CASCADE`, `slot`, `name`, `level`, `attributes JSONB`, `is_wearing`, `suit_type`, timestamps (NOTE: not actively used by current UI)
- **shared_characters**: `id UUID PK`, `snapshot JSONB`, `expires_at` (30 days), timestamps

Indexes: `plans(character_id)`, `equipments(character_id)`, `equipments(slot)`, `shared_characters(id)`.

## Key patterns

- Path alias `@/* → ./src/*`.
- Components barrel-exported from `src/components/index.ts`, hooks from `src/hooks/index.ts`.
- UI primitives in `src/components/ui/` follow shadcn/ui convention (Radix UI + CVA + Tailwind).
- VS Code auto-fixes ESLint + organizes imports on save (`.vscode/setting.json`).
- API routes call `ensureDb()` before DB operations (idempotent, safe to call repeatedly).
- All API responses use `{ success: boolean, ... }` shape.
- DB uses `DATABASE_URL` (despite `.env.example` documenting `POSTGRES_*` vars — the code reads `DATABASE_URL`).
- Score thresholds and color labels defined in `src/lib/scoreConfig.ts` (完美 ≥95, 优秀 ≥80, 良好 ≥65, 及格 ≥40, 需提升 <40).
- TailwindCSS with dark mode (`darkMode: "class"`) and custom semantic color tokens (surface, data categories) defined in `tailwind.config.js`.

## Storage workflow

1. Client calls `GET /api/status` → checks `DATABASE_URL` connectivity
2. If DB available: `initDataSource(false)` → API server mode
3. If no DB: `initLocalDatabase()` → `initDataSource(true)` → localStorage mode
4. In local mode, all CRUD goes through `localStore.ts` (same DataSource interface)
5. **Equipment is always local** regardless of mode — `ApiDataSource` delegates equipment CRUD to `localStore`

## Game data reference

- **Equipment slots**: 主武器, 副武器, 环, 佩, 冠胄, 胸甲, 胫甲, 腕甲, 射决, 弓
- **Flow types (流派)**: 鸣金虹, 鸣金影, 破竹尘, 破竹风, 破竹鸢, 裂石威, 裂石钧, 牵丝玉, 牵丝翊, 牵丝霖
- **Versions**: `5.2（易水）`, `5.3（凝神）`
- **Bow types (弓诀)**: 精准弓, 会心弓, 会意弓
- **Suit types (套装)**: 玉斗, 飞隼, 时雨, 断岳, 烟柳, 浣花, 燕归, 连星, 撼天, 裁云
- **5 Elements for DPS**: 外功, 鸣金, 裂石, 牵丝, 破竹

## Important warnings

- Auth credentials expire after 24h (`timestamp` check in `loadAuthCredentials`).
- Share URLs expire after 30 days (DB-level `expires_at`).
- Legacy/unused dirs: `js/`, `css/`, `base_excel/`, `download_images.py`.
- `README.md` documents `POSTGRES_*` env vars, but the actual code reads `DATABASE_URL` only.
# AGENTS.md — 燕云十六声装备毕业率管理器

## Commands

```bash
npm run dev      # Next.js 14 dev server (turbo mode)
npm run build    # next build (output: 'standalone')
npm run start    # Production server (must build first)
npm run lint     # next lint
npm run lint-fix # next lint --fix
```

No tests, no typecheck script (`strict: false` in tsconfig, `noEmit: true`).

**Local dev env**: Only `DATABASE_URL` is needed (the README documents `POSTGRES_*` vars but the code reads `DATABASE_URL`). Without it, the app runs in localStorage-only mode.

```bash
# .env.local
DATABASE_URL="postgresql://user:password@host/database"
```

**Config data sync**: Run `node tools/download-config.js` to pull latest `equip_data.json`, `suffix_data.json`, `affix_data.json` etc. from `s.166.net` CDN into `tools/config_data/`.

## Project overview

Single-page Next.js 14 App Router app (client component at `src/app/page.tsx`) plus a standalone share page (`src/app/share/[id]/page.tsx`). Calculates equipment graduation rates for the game 燕云十六声 (Where Winds Meet).

Dual-mode data storage: **localStorage** (default when DB unavailable) or **Neon PostgreSQL**.
Mode auto-detected at init via `GET /api/status`. The client calls `initDataSource(isLocal)` from `src/lib/dataSource.ts`.

## Architecture

### Storage layers

```
UI (useAppData hook)
  ↕
DataSource interface (src/lib/dataSource.ts)
  ↕
┌──────────────────────┬────────────────────────┐
│ LocalDataSource      │ ApiDataSource           │
│ → localStore.ts      │ → fetch() to /api/*     │
│ localStorage (keys   │ → db.ts (Neon PG)       │
│   namespaced by      │                         │
│   godUuid)           │ EXCEPT: equipment CRUD  │
│                      │ always delegates to     │
│                      │ localStore.ts directly! │
└──────────────────────┴────────────────────────┘
```

**Critical**: Equipment data is **always stored locally** even in API/DB mode. `ApiDataSource.getEquipments()` / `createEquipment()` / `updateEquipment()` / `deleteEquipment()` all call `localStore` directly — they never hit the database. Only Characters, Plans, Export, and Share go through the DB. This means the `equipments` DB table exists but is only used by legacy code paths, not the current UI.

### DataSource interface

`src/lib/dataSource.ts` defines a `DataSource` interface with methods: `getCharacters`, `createCharacter`, `deleteCharacter`, `getPlans`, `createPlan`, `updatePlan`, `deletePlan`, `getEquipments`, `createEquipment`, `updateEquipment`, `deleteEquipment`, `exportData`, `importData`, `createShare`. Two implementations: `LocalDataSource` and `ApiDataSource`. Singleton accessed via `getDataSource()`.

### State management — useAppData hook

`src/hooks/useAppData.ts` is the **single state management hub** for the entire app. It holds all state: `characters`, `selectedCharacter`, `plans`, `selectedPlan`, `equipments`, `authCredentials`, `availableGameRoles`, `rolePanelData`. All CRUD mutations go through this hook. Components receive data and callbacks as props — there is no React Context or external state library.

### API routes (12 endpoints)

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/status` | GET | Check DB connectivity, returns `{ databaseAvailable, mode }` |
| `/api/init` | GET | Initialize DB tables (idempotent via `ensureDb()`) |
| `/api/config` | GET | Serve static config JSON from `tools/config_data/` |
| `/api/characters` | GET, POST, DELETE | CRUD characters, GET supports `?uuid=` filter |
| `/api/plans` | GET, POST, PUT, DELETE | CRUD build plans for a character |
| `/api/equipments` | GET, POST, PUT, DELETE | CRUD equipment (legacy DB path, UI uses localStore) |
| `/api/graduation` | GET | Graduation rate calculation endpoint |
| `/api/export` | GET, POST | Export/import all user data |
| `/api/share` | POST | Create shareable snapshot (30-day expiry) |
| `/api/auth/*` | POST, GET | QR login proxy to NetEase CC platform, role info fetch |
| `/api/captured` | GET | List captured game data snapshots |
| `/api/import-captured` | POST | Import a captured data snapshot |

All API responses use `{ success: boolean, ... }` shape. Routes call `ensureDb()` before DB operations (idempotent).

### Component tree

```
RootLayout
└── Home (src/app/page.tsx) [client component, ~2000 lines]
    ├── NewCharacterModal / NewPlanModal / NewEquipmentModal
    ├── EditEquipmentModal / ExportModal / AboutModal
    ├── ImportCapturedModal / QRCodeAuthModal / SelectRoleModal
    ├── EquipmentCard / PlanCard
    ├── TuningAssistantReport    (~65KB, largest component)
    ├── DPSGraduationPanel       (~29KB, DPS-based graduation)
    ├── Toast / Modal (reusable)
Separate page:
└── SharePage (src/app/share/[id]/page.tsx)
```

All components barrel-exported from `src/components/index.ts`.

### Two graduation calculation systems

1. **Attribute-based** (`src/lib/graduation.ts`): Weighted scoring per equipment slot against per-slot thresholds. Uses `FLOW_WEIGHTS` (per-flow-type attribute weights) and `SLOT_THRESHOLDS` (per-slot graduation thresholds). Served at `GET /api/graduation`.

2. **DPS-based** (`src/lib/dpsCalculator.ts` + `src/components/DPSGraduationPanel/`): A v3.0 DPS simulator verified against `base_excel/` spreadsheets (587 rows, 0.00% error). Computes per-skill damage across 5 elements (外功/鸣金/裂石/牵丝/破竹) × 4 hit types (会心/会意/普通/擦伤), applies school-specific multipliers (B21 special, col31 for 鸣金), and derives graduation rate as `userDPS / referenceDPS`. Supports 6 of 10 flow types with reference data (破竹风/破竹鸢/牵丝玉/牵丝翊 have no reference data at 105级).

### Auth system (two mechanisms)

1. **FingerprintJS** (`@fingerprintjs/fingerprintjs`): Browser fingerprint for anonymous user identification. Used as `uuid` parameter to associate characters with a device.
2. **NetEase CC QR Login**: Proxy-based QR code auth via `q.reg.163.com`. Fetches actual game role data and equipment. Auth credentials cached in localStorage (`auth_credentials`, `qrcode_auth_cache`) and expire after 24h (timestamp check in `loadAuthCredentials`).

### Equipment import from game

`src/lib/equipmentParser.ts` parses raw equipment data from NetEase's role-info API (`combat_plan.wear_equips`). Maps numeric slot IDs (1→主武器, 2→副武器, 3→冠胄, ...) via `slotMap`, resolves equipment names and affix names from config data (`equip_data.json`, `suffix_data.json`, `affix_data.json`), and converts to the app's `Equipment` type. Parsed equipment cached in localStorage key `auth_{roleId}`.

### Config data pipeline

`tools/download-config.js` downloads JSON config files from `s.166.net` CDN into `tools/config_data/`. These files are served by `GET /api/config` and loaded client-side via `src/lib/configStore.ts`. Config includes equipment definitions, suffix/set names, affix definitions, and school reference data for DPS calculation.

### Database schema (Neon PostgreSQL)

- **characters**: `id UUID PK`, `name`, `icon`, `level`, `server_name`, `role_id` (UNIQUE), `uuid`, `server`, timestamps
- **plans**: `id UUID PK`, `character_id FK→characters ON DELETE CASCADE`, `name`, `flow_type`, `version`, `flow_category`, `bow_type`, `suit_type`, `loan_dingyin BOOLEAN`, timestamps
- **equipments**: `id UUID PK`, `character_id FK→characters ON DELETE CASCADE`, `slot`, `name`, `level`, `attributes JSONB`, `is_wearing`, `suit_type`, timestamps (NOTE: not actively used by current UI)
- **shared_characters**: `id UUID PK`, `snapshot JSONB`, `expires_at` (30 days), timestamps

Indexes: `plans(character_id)`, `equipments(character_id)`, `equipments(slot)`, `shared_characters(id)`.

## Key patterns

- Path alias `@/* → ./src/*`.
- Components barrel-exported from `src/components/index.ts`, hooks from `src/hooks/index.ts`.
- VS Code auto-fixes ESLint + organizes imports on save (`.vscode/setting.json`).
- API routes call `ensureDb()` before DB operations (idempotent, safe to call repeatedly).
- All API responses use `{ success: boolean, ... }` shape.
- DB uses `DATABASE_URL` (despite `.env.example` documenting `POSTGRES_*` vars — the code reads `DATABASE_URL`).

## Storage workflow

1. Client calls `GET /api/status` → checks `DATABASE_URL` connectivity
2. If DB available: `initDataSource(false)` → API server mode
3. If no DB: `initLocalDatabase()` → `initDataSource(true)` → localStorage mode
4. In local mode, all CRUD goes through `localStore.ts` (same DataSource interface)
5. **Equipment is always local** regardless of mode — `ApiDataSource` delegates equipment CRUD to `localStore`

## Game data reference

- **Equipment slots**: 主武器, 副武器, 环, 佩, 冠胄, 胸甲, 胫甲, 腕甲, 射决, 弓
- **Flow types (流派)**: 鸣金虹, 鸣金影, 破竹尘, 破竹风, 破竹鸢, 裂石威, 裂石钧, 牵丝玉, 牵丝翊, 牵丝霖
- **Versions**: `5.2（易水）`, `5.3（凝神）`
- **Bow types (弓诀)**: 精准弓, 会心弓, 会意弓
- **Suit types (套装)**: 玉斗, 飞隼, 时雨, 断岳, 烟柳, 浣花, 燕归, 连星, 撼天, 裁云
- **5 Elements for DPS**: 外功, 鸣金, 裂石, 牵丝, 破竹

## Important warnings

- ⚠️ **SQL injection risk**: `updatePlan()` and `updateEquipment()` in `db.ts` use string-concatenated SQL (`query += `, ${field} = '${values[i]}'``). Any modification to these functions must use parameterized queries (`db` tagged template literal).
- Auth credentials expire after 24h (`timestamp` check in `loadAuthCredentials`).
- Share URLs expire after 30 days (DB-level `expires_at`).
- Legacy/unused dirs: `js/`, `css/`, `base_excel/`, `download_images.py`.
