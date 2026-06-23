# 燕云十六声 毕业率计算器 — 项目长期记忆

## 项目概述
燕云十六声游戏各流派毕业率DPS计算器。从Excel计算器逆向工程出精确公式，构建JS版本。

## 核心公式 (v3.0 — 已验证 0.00%误差)

### 5元素拆分
每行拆分为 外功/鸣金/裂石/牵丝/破竹 五个独立元素：
```
elem_dmg = (即时攻击值 × 倍率 + 固伤) × (1+穿透加成) × (1+伤害加成)
total = sum(所有非零元素)
攻击模式: 会心=AVG((min+max)/2), 会意=MAX(max), 普通=AVG, 擦伤=MIN(min)
主武器元素: 用属性倍率/属性固伤×1.5
其他元素: 用外功倍率, 固伤=0
```

### B21特殊倍率 (1.32x)
- B21=0.32, special = 1+B21 IF skill's Col30 type == school's check_type
- 破竹尘: check_type='回旋伞' → 共鸣/完美伞 1.32x
- 裂石威/钧: check_type='蓄力技' → 三蓄2战意/派生2战意/加速陌刀三蓄 1.32x
- 鸣金影: check_type='流血' → 爆血/流血 1.32x
- 鸣金虹: check_type='蓄力技' → 剑气 1.32x
- 牵丝霖: 始终1.0x (B21=None)

### 聚合公式
- 标准流派: K = 会心×BN + 会意×(1-BN-BO-BP) + 普通×BO + 擦伤×BP
- 鸣金流派: L = 会心×BO + 会意×BM + 普通×BP + 擦伤×BQ; K = L × col31

### col31倍率 (鸣金专用)
- 鸣金影: col31=0.6 (流血/dot), 1.0 (其他)
- 鸣金虹: col31=1.1 (大部分), 0.66 (dot)

## 关键文件
- `tools/dps_formula_v3.js` — 已验证公式模块
- `tools/graduation_rate_calculator_v3.js` — 最终JS计算器
- `tools/reference_data_v3.json` — 参考数据 (571KB, 6流派587行)
- `tools/all_columns_extracted.json` — 原始Excel提取数据

## 验证状态
全部6流派587行 0.00%误差:
牵丝霖(5行) / 破竹尘(106行) / 裂石威(56行) / 裂石钧(96行) / 鸣金影(266行) / 鸣金虹(58行)

破竹鸢: 跳过 (对比用计算器，非DPS计算器)

## 注意事项
- `类型`字段 (武器类型: 伞/剑/枪) ≠ Col30 (技能分类: 回旋伞/蓄力技/流血)
- 鸣金流派列映射偏移: Col11=真气比列=K, Col12=期望=L (标准流派 Col11=期望=K)
- Excel "总伤" 包含结算(subtotal)行，应使用纯技能行计算参考DPS

## 前端集成 (2026-06-22)

DPS 毕业率计算器已集成到 Next.js 前端项目：

### 新增源文件
- `src/lib/dpsCalculator.ts` — TypeScript 核心计算器 (DPSGraduationCalculator 类)
- `src/lib/dpsReferenceData.ts` — 参考数据模块 (266KB, 6流派587行)
- `src/components/DPSGraduationPanel/index.tsx` — 毕业率面板UI组件

### 修改文件
- `src/components/index.ts` — 添加 DPSGraduationPanel 导出
- `src/app/page.tsx` — 在角色属性面板下插入 DPSGraduationPanel

### 数据映射
- RolePanelData 的 MIN_W_ATK/MAX_W_ATK → 外功, MIN_PRO_ATK_A/B/C/E → 鸣金/牵丝/裂石/破竹
- 穿透/增伤：使用参考数据默认值
- FlowType → schoolKey: 鸣金虹→鸣金虹_105, etc. (破竹风/鸢/牵丝玉/翊 → null, 无参考数据)
