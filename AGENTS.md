# AGENTS.md — 燕云十六声装备毕业率管理器

## Commands

```bash
npm run dev      # Next.js 14 dev server
npm run build    # next build (output: 'standalone')
npm run lint     # next lint
npm run lint-fix # next lint --fix
```

No tests, no typecheck script (`strict: false` in tsconfig, `noEmit: true`).

## Project overview

Single-page Next.js 14 App Router app (client component at `src/app/page.tsx`).  
Calculates equipment graduation rates for the game 燕云十六声 (Where Winds Meet).

Dual-mode data storage: **localStorage** (default when DB unavailable) or **Neon PostgreSQL**.  
Mode auto-detected at init via `GET /api/status`. The client calls `initDataSource(isLocal)` from `src/lib/dataSource.ts`.

## Architecture

| Layer | Location |
|---|---|
| API routes | `src/app/api/*/route.ts` (18 endpoints) |
| DB layer | `src/lib/db.ts` — raw SQL via `@neondatabase/serverless`, env var `DATABASE_URL` |
| Local storage | `src/lib/localStore.ts` — namespaced keys with `godUuid` suffix |
| Graduation calc | `src/lib/graduation.ts` (also served at `GET /api/graduation`) |
| Config data | JSON files in `tools/config_data/` served at `GET /api/config` |
| Auth | Proxy to NetEase CC platform QR login (`q.reg.163.com`) |

### Key patterns

- API routes call `ensureDb()` before DB operations (idempotent, safe to call repeatedly).
- All API responses use `{ success: boolean, ... }` shape.
- Path alias `@/* → ./src/*`.
- Components barrel-exported from `src/components/index.ts`.
- Hooks barrel-exported from `src/hooks/index.ts`.
- VS Code auto-fixes ESLint + organizes imports on save (`.vscode/setting.json`).
- DB uses `DATABASE_URL` (despite `.env.example` documenting `POSTGRES_*` vars—the code reads `DATABASE_URL`).
- Config data (`equip_data.json`, `suffix_data.json`, `affix_data.json`, etc.) downloaded from `s.166.net` CDN via `tools/download-config.js`.

### Data model

- Characters → Plans (1:N), Equipments (1:N)
- Share: 30-day expiry, stored in `shared_characters` table
- Equipment attributes: JSONB array of `{ name, value, is_main, rate?, quality? }`

## Storage workflow

1. Client calls `GET /api/status` → checks `DATABASE_URL` connectivity
2. If DB available: `initDataSource(false)` → API server mode
3. If no DB: `initLocalDatabase()` → `initDataSource(true)` → localStorage mode
4. In local mode, all CRUD goes through `localStore.ts` (same API interface)

## Important details

- **Equipment slots**: 主武器, 副武器, 环, 佩, 冠胄, 胸甲, 胫甲, 腕甲, 射决, 弓
- **Flow types (流派)**: 鸣金虹, 鸣金影, 破竹尘, 破竹风, 破竹鸢, 裂石威, 裂石钧, 牵丝玉, 牵丝翊, 牵丝霖
- **Versions**: `5.2（易水）`, `5.3（凝神）`
- **Bow types (弓诀)**: 精准弓, 会心弓, 会意弓
- **Suit types (套装)**: 玉斗, 飞隼, 时雨, 断岳, 烟柳, 浣花, 燕归, 连星, 撼天, 裁云
- Auth credentials expire after 24h (`timestamp` check in `loadAuthCredentials`)
- Share URLs expire after 30 days (DB-level `expires_at`)
- `updatePlan` and `updateEquipment` in `db.ts` use string-concatenated SQL (escape risk — agent should use parameterized queries when modifying)
- Equipment cache stored in localStorage key `auth_{roleId}`
- Legacy/unused dirs: `js/`, `css/`, `base_excel/`, `download_images.py`
