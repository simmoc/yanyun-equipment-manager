# 燕云十六声装备毕业率管理器

专为燕云十六声竞速玩家打造的毕业率计算与装备管理平台。

## 功能特点

- 🔐 **浏览器指纹登录** - 无需注册账号，自动识别用户身份
- 👤 **多角色管理** - 支持创建多个游戏角色
- 🎯 **装备管理** - 按部位分类管理所有装备（剑/枪/环/佩/冠胄/胸甲/胫甲/腕甲）
- 📊 **流派方案** - 支持10种流派配置（鸣金虹/鸣金影/破竹尘等）
- 📈 **毕业率计算** - 实时计算装备毕业进度，提供优化建议
- 💾 **数据导入导出** - 支持数据备份和迁移

## 技术架构

- **前端**: Next.js 14 + React + TailwindCSS
- **后端**: Vercel Edge Functions
- **数据库**: Neon PostgreSQL
- **认证**: FingerprintJS 浏览器指纹

## 部署指南

### 1. 准备 Neon PostgreSQL 数据库

1. 访问 [Neon](https://neon.tech/) 注册账号
2. 创建新项目，获取数据库连接信息
3. 记录以下环境变量：
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

### 2. 部署到 Vercel

#### 方式一：通过 Vercel Dashboard

1. Fork 本项目到你的 GitHub 账号
2. 登录 [Vercel](https://vercel.com/)
3. 点击 "New Project" 导入你的 GitHub 项目
4. 在 Environment Variables 中添加 Neon 数据库的环境变量
5. 点击 Deploy

#### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 添加环境变量
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
vercel env add POSTGRES_USER
vercel env add POSTGRES_HOST
vercel env add POSTGRES_PASSWORD
vercel env add POSTGRES_DATABASE
```

### 3. 初始化数据库

部署完成后，访问 `/api/init` 接口初始化数据库表结构：

```
https://your-domain.vercel.app/api/init
```

## 本地开发

```bash
# 克隆项目
git clone https://github.com/simmoc/yanyun-equipment-manager.git

# 安装依赖
npm install

# 创建 .env.local 文件，添加数据库环境变量
POSTGRES_URL="your-neon-postgres-url"
POSTGRES_PRISMA_URL="your-neon-prisma-url"
POSTGRES_URL_NON_POOLING="your-neon-non-pooling-url"
POSTGRES_USER="your-user"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="your-database"

# 启动开发服务器
npm run dev
```

## 流派支持

| 流派 | 类型 |
|------|------|
| 鸣金虹 | 鸣金 |
| 鸣金影 | 鸭金 |
| 破竹尘 | 破竹 |
| 破竹风 | 破竹 |
| 破竹鸢 | 破竹 |
| 裂石威 | 裂石 |
| 裂石钧 | 裂石 |
| 牵丝玉 | 牵丝 |
| 牵丝翊 | 牵丝 |
| 牵丝霖 | 牵丝 |

## 套装支持

玉斗、飞隼、时雨、断岳、烟柳、浣花、燕归、连星、撼天、裁云

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth` | POST/GET | 用户认证 |
| `/api/characters` | GET/POST/DELETE | 角色管理 |
| `/api/plans` | GET/POST/PUT/DELETE | 方案管理 |
| `/api/equipments` | GET/POST/PUT/DELETE | 装备管理 |
| `/api/graduation` | GET | 毕业率计算 |
| `/api/export` | GET/POST | 数据导入导出 |
| `/api/init` | GET | 数据库初始化 |

## 许可证

MIT License

## 致谢

本项目的核心算法与流派逻辑参考了 v佬 (Violetta)@片雲 制作的系列竞速毕业率Excel计算器，以及秋夕君发布的网页版本。