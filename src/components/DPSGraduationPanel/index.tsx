'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Plan, RolePanelData, FlowType, Equipment } from '@/types';
import { FLOW_TYPES } from '@/types';
import {
  DPSGraduationCalculator,
  FLOW_TO_SCHOOL_KEY,
  ELEMENT_NAMES,
  DINGYIN_BONUS_MAX_110,
  DINGYIN_PENETRATION_MAX_110,
  REF_BOSS_BONUS,
  REF_ALL_WEAPON_BONUS,
  REF_WEAPON_BONUS,
  type SchoolRefData,
  SCHOOL_WEAPON_AFFIX_MAP,
  type SpecialBonusMap,
  type UserEquipment,
} from '@/lib/dpsCalculator';
import { SCHOOL_REF_DATA } from '@/lib/dpsReferenceData';

/* ================================================================
   常量 & 映射
   ================================================================ */

const PANEL_FIELD_MAP: Record<string, { min: string; max: string }> = {
  '外功': { min: 'MIN_W_ATK', max: 'MAX_W_ATK' },
  '鸣金': { min: 'MIN_PRO_ATK_A', max: 'MAX_PRO_ATK_A' },
  '牵丝': { min: 'MIN_PRO_ATK_B', max: 'MAX_PRO_ATK_B' },
  '裂石': { min: 'MIN_PRO_ATK_C', max: 'MAX_PRO_ATK_C' },
  '破竹': { min: 'MIN_PRO_ATK_E', max: 'MAX_PRO_ATK_E' },
};

const XINFA_TO_FLOW: Record<string, string> = {
  '104': '鸣金虹', '154': '鸣金影', '451': '破竹风', '501': '破竹尘',
  '551': '裂石钧', '401': '裂石威', '304': '牵丝玉', '351': '牵丝霖',
  '601': '破竹鸢', '651': '牵丝翊',
};

/* ================================================================
   Helpers
   ================================================================ */

function extractUserEquipment(panel: RolePanelData): UserEquipment {
  const equipment: UserEquipment = {};
  for (const elemName of ELEMENT_NAMES) {
    const m = PANEL_FIELD_MAP[elemName];
    if (!m) continue;
    const minV = parseFloat((panel as any)[m.min]) || 0;
    const maxV = parseFloat((panel as any)[m.max]) || 0;
    if (minV > 0 || maxV > 0) equipment[elemName] = { min: minV, max: maxV };
  }
  return equipment;
}

function extractBossBonus(equipments: Equipment[]): number {
  let total = 0;
  for (const equip of equipments) {
    for (const attr of equip.attributes) {
      if (attr.name && (attr.name.includes('首领') || attr.name.includes('对首领'))) {
        const v = typeof attr.value === 'number' ? attr.value : parseFloat(String(attr.value)) || 0;
        total += v > 1 ? v / 100 : v;
      }
    }
  }
  return total;
}

function extractDingyinBonus(equipments: Equipment[]): number {
  const dingyinPatterns = [
    '蓄力技增伤', '流血增伤', '回旋伞增伤', '武学技增伤',
    '特殊技增伤', '鼠鼠增伤', '治疗技增疗',
  ];
  let total = 0;
  for (const equip of equipments) {
    if (equip.attributes.length === 0) continue;
    const lastAttr = equip.attributes[equip.attributes.length - 1];
    if (lastAttr.name) {
      const isDingyin = dingyinPatterns.some(p => lastAttr.name.includes(p));
      if (isDingyin) {
        const v = typeof lastAttr.value === 'number' ? lastAttr.value : parseFloat(String(lastAttr.value)) || 0;
        total += v > 1 ? v / 100 : v;
      }
    }
  }
  return total;
}

function extractDingyinBonuses(equipments: Equipment[]): SpecialBonusMap {
  const categoryPatterns: Array<[string, string]> = [
    ['蓄力技', '蓄力技'],
    ['流血', '流血'],
    ['回旋伞', '回旋伞'],
    ['特殊技', '特殊技'],
    ['鼠鼠', '老鼠'],
    ['老鼠', '老鼠'],
    ['轻击', '轻击'],
    ['弹道', '弹道'],
    ['武学技', '武学技'],
    ['治疗技', '治疗技'],
  ];
  const bonuses: SpecialBonusMap = {};

  for (const equip of equipments) {
    if (equip.attributes.length === 0) continue;
    const lastAttr = equip.attributes[equip.attributes.length - 1];
    if (!lastAttr.name) continue;

    const matched = categoryPatterns.find(([pattern]) => lastAttr.name.includes(pattern));
    if (!matched) continue;

    const v = typeof lastAttr.value === 'number' ? lastAttr.value : parseFloat(String(lastAttr.value)) || 0;
    bonuses[matched[1]] = (bonuses[matched[1]] || 0) + (v > 1 ? v / 100 : v);
  }

  return bonuses;
}

function extractDingyinPenetration(equipments: Equipment[]): number {
  const penetPatterns = ['外功穿透', '外攻穿透'];
  let total = 0;
  for (const equip of equipments) {
    if (equip.attributes.length === 0) continue;
    const lastAttr = equip.attributes[equip.attributes.length - 1];
    if (lastAttr.name) {
      const isPenet = penetPatterns.some(p => lastAttr.name.includes(p));
      if (isPenet) {
        const v = typeof lastAttr.value === 'number' ? lastAttr.value : parseFloat(String(lastAttr.value)) || 0;
        total += v > 1 ? v : v * 100;
      }
    }
  }
  return total;
}

function buildLoanSpecialBonuses(schoolRef: SchoolRefData): SpecialBonusMap | undefined {
  const bonuses: SpecialBonusMap = {};

  for (const [category, value] of Object.entries(schoolRef.specialBonuses ?? {})) {
    bonuses[category] = value > 0 ? DINGYIN_BONUS_MAX_110 : value;
  }

  if (schoolRef.checkType && (schoolRef.B21 ?? 0) > 0) {
    bonuses[schoolRef.checkType] = DINGYIN_BONUS_MAX_110;
  }

  return Object.keys(bonuses).length > 0 ? bonuses : undefined;
}

function extractAllWeaponBonus(equipments: Equipment[]): number {
  let total = 0;
  for (const equip of equipments) {
    for (const attr of equip.attributes) {
      if (attr.name && (attr.name.includes('全武学增效') || attr.name.includes('全武学增伤'))) {
        const v = typeof attr.value === 'number' ? attr.value : parseFloat(String(attr.value)) || 0;
        total += v > 1 ? v / 100 : v;
      }
    }
  }
  return total;
}

function extractWeaponBonus(equipments: Equipment[], schoolWeapon: string): number {
  const affixName = SCHOOL_WEAPON_AFFIX_MAP[schoolWeapon];
  if (!affixName) return 0;
  const baseName = affixName.replace('增伤', '').replace('增效', '');
  let total = 0;
  for (const equip of equipments) {
    for (const attr of equip.attributes) {
      if (attr.name && (attr.name.includes(affixName) || attr.name.includes(baseName + '增效'))) {
        const v = typeof attr.value === 'number' ? attr.value : parseFloat(String(attr.value)) || 0;
        total += v > 1 ? v / 100 : v;
      }
    }
  }
  return total;
}

function detectFlowByXinfa(rolePanelData?: RolePanelData | null): string | null {
  if (!rolePanelData) return null;
  const src = rolePanelData['combat_plan.xinfa_info'] || rolePanelData.xinfa_info;
  if (!src || typeof src !== 'object') return null;
  for (const idStr of Object.keys(src)) {
    const flow = XINFA_TO_FLOW[idStr];
    if (flow) return flow;
  }
  return null;
}

function matchFlowByApi(
  panel: RolePanelData | null | undefined,
  apiData: Record<string, ApiFlowEntry> | null,
  nameMap: Record<string, string> | null | undefined,
): string | null {
  if (!panel || !apiData || !nameMap) return null;
  const src = panel['combat_plan.xinfa_info'] || panel.xinfa_info;
  if (!src || typeof src !== 'object') return null;
  const equipped = new Set<string>();
  for (const idStr of Object.keys(src)) { const n = nameMap[idStr]; if (n) equipped.add(n); }
  for (const [ft, entry] of Object.entries(apiData)) {
    const commend = entry.xinfa?.commend;
    if (!commend) continue;
    for (const combo of commend) { if (combo.some(n => equipped.has(n))) return ft; }
  }
  return null;
}

function getRateColor(rate: number): string {
  if (rate >= 0.95) return '#2dd4bf';   // teal (完美)
  if (rate >= 0.85) return '#a3e635';   // lime (优秀)
  if (rate >= 0.70) return '#facc15';   // yellow (良好)
  if (rate >= 0.50) return '#fb923c';   // orange (入门)
  return '#f87171';                      // red (未达标)
}

function getRateLabel(rate: number): string {
  if (rate >= 0.95) return '完美毕业';
  if (rate >= 0.85) return '优秀';
  if (rate >= 0.70) return '良好';
  if (rate >= 0.50) return '入门';
  return '未达标';
}

/* ================================================================
   Types
   ================================================================ */

interface DPSGraduationPanelProps {
  rolePanelData: RolePanelData | null;
  selectedPlan: Plan | null;
  equipments?: Equipment[];
  xinfaNameMap?: Record<string, string> | null;
}

interface ApiFlowEntry {
  value: string; wuxue?: string[];
  xinfa?: { commend: string[][]; position?: string[] };
  equit?: Array<Array<{ type: string; name: string }>>;
  qishu?: { season?: string[]; fighting?: string[]; Decrypt?: string[] };
  tuningAdvice: any;
}

/* ================================================================
   Component
   ================================================================ */

export function DPSGraduationPanel({
  rolePanelData, selectedPlan, equipments, xinfaNameMap,
}: DPSGraduationPanelProps) {
  const [selectedFlowType, setSelectedFlowType] = useState<string | null>(null);
  const [userOverrode, setUserOverrode] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [apiData, setApiData] = useState<Record<string, ApiFlowEntry> | null>(null);
  const [loanDingyin, setLoanDingyin] = useState(selectedPlan?.loan_dingyin ?? false);

  // Track rolePanelData identity to detect character switches
  const prevRoleIdRef = useRef<string | undefined>(rolePanelData?.roleId);

  useEffect(() => {
    fetch('/api/ai-transfer-tool')
      .then(r => r.json()).then(d => { if (d?.data?.recommend) setApiData(d.data.recommend); }).catch(() => {});
  }, []);

  // Reset flow type detection when character changes (roleId changes)
  useEffect(() => {
    const currentRoleId = rolePanelData?.roleId;
    if (currentRoleId && currentRoleId !== prevRoleIdRef.current) {
      setSelectedFlowType(null);
      setUserOverrode(false);
      setShowSelector(false);
      setLoanDingyin(selectedPlan?.loan_dingyin ?? false);
    }
    prevRoleIdRef.current = currentRoleId;
  }, [rolePanelData?.roleId]);

  const resolvedFlowType = selectedPlan?.flow_type || selectedFlowType;

  useEffect(() => {
    if (selectedPlan?.flow_type) { setUserOverrode(false); return; }
    if (userOverrode) return;
    if (selectedFlowType) return;
    if (!rolePanelData) return;
    const d = detectFlowByXinfa(rolePanelData) || matchFlowByApi(rolePanelData, apiData, xinfaNameMap);
    if (d) setSelectedFlowType(d);
  }, [rolePanelData, selectedPlan, userOverrode, selectedFlowType, apiData, xinfaNameMap]);

  const schoolRef = useMemo(() => {
    if (!resolvedFlowType) return null;
    const schoolKey = FLOW_TO_SCHOOL_KEY[resolvedFlowType as FlowType];
    if (!schoolKey) return null;
    return SCHOOL_REF_DATA[schoolKey] || null;
  }, [resolvedFlowType]);

  const result = useMemo(() => {
    if (!rolePanelData || !resolvedFlowType || !schoolRef) return null;
    const schoolKey = FLOW_TO_SCHOOL_KEY[resolvedFlowType as FlowType];
    if (!schoolKey) return { error: `流派 "${resolvedFlowType}" 暂无 DPS 参考数据` };
    const equipment = extractUserEquipment(rolePanelData);
    if (Object.keys(equipment).length === 0) return { error: '角色面板数据中未找到攻击属性' };

    const equipList = equipments || [];
    const bossBonus = equipList.length > 0 ? extractBossBonus(equipList) : REF_BOSS_BONUS;
    const extractedSpecialBonuses = equipList.length > 0 ? extractDingyinBonuses(equipList) : {};
    const hasCategorizedDingyin = Object.keys(extractedSpecialBonuses).length > 0;
    const extractedDingyin = equipList.length > 0 && !hasCategorizedDingyin ? extractDingyinBonus(equipList) : 0;
    const referenceDingyinBonus = schoolRef.B21 ?? DINGYIN_BONUS_MAX_110;
    const dingyinBonus = loanDingyin ? DINGYIN_BONUS_MAX_110 : (extractedDingyin || referenceDingyinBonus);
    const specialBonuses = loanDingyin ? buildLoanSpecialBonuses(schoolRef) : (hasCategorizedDingyin ? extractedSpecialBonuses : undefined);
    const isQiansilin = schoolKey.startsWith('牵丝霖');
    const defaultAllWeapon = isQiansilin ? 0 : REF_ALL_WEAPON_BONUS;
    const defaultWeapon = isQiansilin ? 0 : REF_WEAPON_BONUS;
    const allWeaponBonus = equipList.length > 0 ? extractAllWeaponBonus(equipList) : defaultAllWeapon;
    const weaponBonus = equipList.length > 0 ? extractWeaponBonus(equipList, schoolRef.mainWeapon) : defaultWeapon;
    const extractedDingyinPenet = equipList.length > 0 ? extractDingyinPenetration(equipList) : 0;
    const dingyinPenetration = loanDingyin ? DINGYIN_PENETRATION_MAX_110 : (extractedDingyinPenet > 0 ? extractedDingyinPenet : undefined);

    try {
      const calc = new DPSGraduationCalculator(schoolKey, schoolRef);
      const res = calc.calculate({ equipment, bossBonus, dingyinBonus, specialBonuses, allWeaponBonus, weaponBonus, dingyinPenetration });
      return { res, schoolKey, isMingjin: schoolRef.isMingjin, bossBonus, dingyinBonus, allWeaponBonus, weaponBonus, dingyinPenetration, loanDingyin };
    } catch (e: any) { return { error: `计算失败: ${e.message}` }; }
  }, [rolePanelData, resolvedFlowType, equipments, loanDingyin]);

  /* ── No panel ── */
  if (!rolePanelData) {
    return (
      <div className="surface-panel sidebar-panel">
        <h2 className="text-base font-bold mb-2 text-yellow-400">DPS 毕业率</h2>
        <p className="text-gray-400 text-sm">暂无角色面板数据</p>
      </div>
    );
  }

  /* ── Flow selector ── */
  if (!resolvedFlowType) {
    if (showSelector) return <FlowSelector
      selectedFlowType={selectedFlowType}
      setSelectedFlowType={(v) => { setSelectedFlowType(v); setUserOverrode(false); setShowSelector(false); }}
    />;
    return (
      <div className="surface-panel sidebar-panel">
        <h2 className="text-base font-bold mb-2 text-yellow-400">DPS 毕业率</h2>
        <div className="text-center py-3 text-gray-400 text-sm space-y-2">
          {!selectedPlan ? (
            <>
              <p>请选择方案，或</p>
              <button
                type="button"
                onClick={() => setShowSelector(true)}
                className="px-2 py-1 text-xs rounded bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition"
              >
                手动选择流派
              </button>
            </>
          ) : <p>正在识别流派...</p>}
        </div>
      </div>
    );
  }

  const showFlowBanner = !selectedPlan?.flow_type;

  if (!result || 'error' in result) {
    return (
      <div className="surface-panel sidebar-panel">
        <h2 className="text-base font-bold mb-2 text-yellow-400">DPS 毕业率</h2>
        {showFlowBanner && <FlowBanner flow={resolvedFlowType} onSwitch={() => { setSelectedFlowType(null); setUserOverrode(true); setShowSelector(true); }} />}
        <p className="text-center py-3 text-gray-400 text-sm">{result?.error || '计算失败'}</p>
      </div>
    );
  }

  const { res, bossBonus: usedBossBonus, dingyinBonus: usedDingyinBonus, allWeaponBonus: usedAllWeaponBonus, weaponBonus: usedWeaponBonus, dingyinPenetration: usedDingyinPenetration } = result;
  const rate = res.毕业率数值, color = getRateColor(rate), label = getRateLabel(rate);

  return (
    <div className="surface-panel sidebar-panel animate-fade-in-up">
      <h2 className="text-base font-bold mb-2 text-yellow-400">DPS 毕业率</h2>
      <div className="space-y-3">
        {showFlowBanner && <FlowBanner flow={resolvedFlowType} onSwitch={() => { setSelectedFlowType(null); setUserOverrode(true); setShowSelector(true); }} />}

        <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-5xl font-black tracking-tight" style={{ color }}>
              {(rate * 100).toFixed(2)}
              <span className="text-2xl ml-0.5 text-gray-400">%</span>
            </div>
            <div className="text-xs mt-1" style={{ color }}>{label}</div>
            <div className="text-xs mt-1 text-gray-400">{res.流派.replace(/_(105|110)$/, '')} · {res.模式}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric label="当前 DPS" value={res.DPS.toLocaleString()} />
          <Metric label="毕业档 DPS" value={res.毕业档DPS.toLocaleString()} />
          <Metric label="期望总伤" value={(res.总期望伤害 / 10000).toFixed(2) + ' 万'} />
          <Metric label="战斗时长" value={`${res.战斗时间.toFixed(1)}s`} />
        </div>

        <div className="bg-gray-700/30 p-2 rounded-lg">
          <div className="text-xs font-bold mb-1.5 text-yellow-300">增伤因子</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <Factor label="首领增伤" value={usedBossBonus != null ? '+' + (usedBossBonus * 100).toFixed(1) + '%' : `默认 ${(REF_BOSS_BONUS * 100).toFixed(1)}%`} valueClass="text-orange-400" />
            <Factor label="全武增" value={usedAllWeaponBonus != null ? '+' + (usedAllWeaponBonus * 100).toFixed(1) + '%' : `默认 ${(REF_ALL_WEAPON_BONUS * 100).toFixed(1)}%`} valueClass="text-purple-400" />
            <Factor label="武器增" value={usedWeaponBonus != null ? '+' + (usedWeaponBonus * 100).toFixed(1) + '%' : `默认 ${(REF_WEAPON_BONUS * 100).toFixed(1)}%`} valueClass="text-green-400" />
            <Factor label="定音增伤" value={loanDingyin ? `+${(DINGYIN_BONUS_MAX_110 * 100).toFixed(1)}% (贷款)` : usedDingyinBonus != null ? '+' + (usedDingyinBonus * 100).toFixed(1) + '%' : `默认 ${(DINGYIN_BONUS_MAX_110 * 100).toFixed(1)}%`} valueClass="text-yellow-400" />
            <div className="col-span-2 flex justify-between">
              <span className="text-gray-400">外功穿透定音</span>
              <span className="text-cyan-400">
                {loanDingyin
                  ? `${DINGYIN_PENETRATION_MAX_110.toFixed(1)}% (贷款满值)`
                  : usedDingyinPenetration != null && usedDingyinPenetration > 0
                    ? `${usedDingyinPenetration.toFixed(1)}%`
                    : `参考 ${schoolRef?.refPenetBase?.toFixed(1) ?? '?'}%`}
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={loanDingyin}
              onChange={(event) => setLoanDingyin(event.target.checked)}
              className="h-3.5 w-3.5 accent-yellow-500"
            />
            <span>贷款定音 (按 110 满值)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Sub-components
   ================================================================ */

function FlowBanner({ flow, onSwitch }: { flow: string; onSwitch: () => void }) {
  return (
    <div className="flex items-center justify-between bg-yellow-900/30 border border-yellow-700/50 p-2 rounded-lg text-xs text-yellow-300">
      <span>自动识别：{flow}</span>
      <button
        type="button"
        onClick={onSwitch}
        className="text-yellow-200 hover:text-yellow-100 transition"
      >
        切换
      </button>
    </div>
  );
}

function FlowSelector({ selectedFlowType, setSelectedFlowType }: {
  selectedFlowType: string | null;
  setSelectedFlowType: (v: string) => void;
}) {
  const [localType, setLocalType] = useState(selectedFlowType || '');
  const availableFlows = FLOW_TYPES.filter(ft => FLOW_TO_SCHOOL_KEY[ft]);

  return (
    <div className="surface-panel sidebar-panel">
      <h2 className="text-base font-bold mb-2 text-yellow-400">DPS 毕业率</h2>
      <div className="space-y-3">
        <p className="text-gray-400 text-sm">无法从心法自动识别流派，请手动选择：</p>
        <div className="flex flex-wrap gap-1.5">
          {availableFlows.map((flow) => (
            <button
              key={flow}
              type="button"
              onClick={() => setLocalType(flow)}
              className={`px-2 py-1 text-xs rounded transition ${
                localType === flow
                  ? 'bg-yellow-500 text-gray-900 font-bold'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {flow}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSelectedFlowType(localType || availableFlows[0])}
          className="w-full px-2 py-1.5 text-xs rounded bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition"
        >
          确认流派
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700/40 p-2 rounded">
      <div className="text-gray-400">{label}</div>
      <div className="text-white font-bold text-sm">{value}</div>
    </div>
  );
}

function Factor({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={valueClass || 'text-white'}>{value}</span>
    </div>
  );
}
