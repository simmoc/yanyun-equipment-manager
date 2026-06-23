'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Plan, RolePanelData, FlowType, Equipment } from '@/types';
import { FLOW_TYPES } from '@/types';
import {
  DPSGraduationCalculator,
  FLOW_TO_SCHOOL_KEY,
  ELEMENT_NAMES,
  REF_BOSS_BONUS,
  REF_ALL_WEAPON_BONUS,
  REF_WEAPON_BONUS,
  SCHOOL_WEAPON_AFFIX_MAP,
  type UserEquipment,
} from '@/lib/dpsCalculator';
import { SCHOOL_REF_DATA } from '@/lib/dpsReferenceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';

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

/** 贷款定音值 (参考 Excel B21) */
const DEFAULT_DINGYIN_BONUS = 0.32;

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
    fetch('https://s.166.net/config/ds_h72/ai_transfer_tool.json')
      .then(r => r.json()).then(d => { if (d?.recommend) setApiData(d.recommend); }).catch(() => {});
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
    const extractedDingyin = equipList.length > 0 ? extractDingyinBonus(equipList) : 0;
    const dingyinBonus = loanDingyin ? DEFAULT_DINGYIN_BONUS : (extractedDingyin || DEFAULT_DINGYIN_BONUS);
    const isQiansilin = schoolKey === '牵丝霖_105';
    const defaultAllWeapon = isQiansilin ? 0 : REF_ALL_WEAPON_BONUS;
    const defaultWeapon = isQiansilin ? 0 : REF_WEAPON_BONUS;
    const allWeaponBonus = equipList.length > 0 ? extractAllWeaponBonus(equipList) : defaultAllWeapon;
    const weaponBonus = equipList.length > 0 ? extractWeaponBonus(equipList, schoolRef.mainWeapon) : defaultWeapon;
    const extractedDingyinPenet = equipList.length > 0 ? extractDingyinPenetration(equipList) : 0;
    const dingyinPenetration = loanDingyin ? undefined : (extractedDingyinPenet > 0 ? extractedDingyinPenet : undefined);

    try {
      const calc = new DPSGraduationCalculator(schoolKey, schoolRef);
      const res = calc.calculate({ equipment, bossBonus, dingyinBonus, allWeaponBonus, weaponBonus, dingyinPenetration });
      return { res, schoolKey, isMingjin: schoolRef.isMingjin, bossBonus, dingyinBonus, allWeaponBonus, weaponBonus, dingyinPenetration, loanDingyin };
    } catch (e: any) { return { error: `计算失败: ${e.message}` }; }
  }, [rolePanelData, resolvedFlowType, equipments, loanDingyin]);

  /* ── No panel ── */
  if (!rolePanelData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-data-dps">DPS 毕业率</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-3 text-muted-foreground text-sm">暂无角色面板数据</p>
        </CardContent>
      </Card>
    );
  }

  /* ── Flow selector ── */
  if (!resolvedFlowType) {
    if (showSelector) return <FlowSelector
      selectedFlowType={selectedFlowType}
      setSelectedFlowType={(v) => { setSelectedFlowType(v); setUserOverrode(false); setShowSelector(false); }}
    />;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-data-dps">DPS 毕业率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-3 text-muted-foreground text-sm space-y-2">
            {!selectedPlan ? (
              <><p>请选择方案，或</p>
              <Button variant="outline" size="sm" onClick={() => setShowSelector(true)} className="text-data-dps border-data-dps/30 hover:bg-data-dps/10">
                手动选择流派
              </Button></>
            ) : <p>正在识别流派...</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const showFlowBanner = !selectedPlan?.flow_type;

  if (!result || 'error' in result) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-data-dps">DPS 毕业率</CardTitle>
        </CardHeader>
        <CardContent>
          {showFlowBanner && <FlowBanner flow={resolvedFlowType} onSwitch={() => { setSelectedFlowType(null); setUserOverrode(true); setShowSelector(true); }} />}
          <p className="text-center py-3 text-muted-foreground text-sm">{result?.error || '计算失败'}</p>
        </CardContent>
      </Card>
    );
  }

  const { res, bossBonus: usedBossBonus, dingyinBonus: usedDingyinBonus, allWeaponBonus: usedAllWeaponBonus, weaponBonus: usedWeaponBonus, dingyinPenetration: usedDingyinPenetration } = result;
  const rate = res.毕业率数值, color = getRateColor(rate), label = getRateLabel(rate);

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-data-dps">DPS 毕业率</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showFlowBanner && <FlowBanner flow={resolvedFlowType} onSwitch={() => { setSelectedFlowType(null); setUserOverrode(true); setShowSelector(true); }} />}

        {/* ── 毕业率主指标 ── */}
        <div className="bg-surface-section rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">毕业率</span>
            <span className="text-2xl font-bold" style={{ color }}>{res.毕业率}</span>
          </div>
          <div className="w-full h-2.5 bg-surface-hover rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, rate * 100))}%`, backgroundColor: color }} />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <Badge variant="outline" style={{ color, borderColor: color }} className="text-[10px]">{label}</Badge>
            <span className="text-muted-foreground text-xs">{res.流派.replace('_105', '')} · {res.模式}</span>
          </div>
        </div>

        {/* ── DPS 对比 ── */}
        <div className="bg-surface-section rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1">
          <KV label="当前 DPS" value={res.DPS.toLocaleString()} valueClass="text-foreground" />
          <KV label="毕业档 DPS" value={res.毕业档DPS.toLocaleString()} valueClass="text-data-attack" />
          <KV label="战斗时间" value={`${res.战斗时间}s`} valueClass="text-muted-foreground" />
          <KV label="期望总伤" value={(res.总期望伤害 / 10000).toFixed(1) + '万'} valueClass="text-muted-foreground" />
        </div>

        {/* ── 增伤因子 ── */}
        <div className="bg-surface-section rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">首领增伤</span>
            <span className="text-xs text-data-boss font-mono">
              {usedBossBonus != null ? '+' + (usedBossBonus * 100).toFixed(1) + '%' : '默认 8.8%'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">全武增</span>
            <span className="text-xs text-data-weapon font-mono">
              {usedAllWeaponBonus != null ? '+' + (usedAllWeaponBonus * 100).toFixed(1) + '%' : '默认 8.4%'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">武器增</span>
            <span className="text-xs text-data-attack font-mono">
              {usedWeaponBonus != null ? '+' + (usedWeaponBonus * 100).toFixed(1) + '%' : '默认 8.6%'}
            </span>
          </div>
          <Separator className="bg-border/50" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">定音增伤</span>
            <span className="text-xs text-data-dingyin font-mono">
              {loanDingyin ? '+32.0% (贷款)' : usedDingyinBonus != null ? '+' + (usedDingyinBonus * 100).toFixed(1) + '%' : '默认 32.0%'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">外功穿透定音</span>
            <span className="text-xs text-cyan-400 font-mono">
              {loanDingyin
                ? `参考 ${schoolRef?.refPenetBase?.toFixed(1) ?? '?'}% (贷款)`
                : usedDingyinPenetration != null && usedDingyinPenetration > 0
                  ? `${usedDingyinPenetration.toFixed(1)}%`
                  : `参考 ${schoolRef?.refPenetBase?.toFixed(1) ?? '?'}%`}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <Checkbox
              checked={loanDingyin}
              onCheckedChange={(checked) => setLoanDingyin(!!checked)}
              className="border-muted-foreground data-[state=checked]:bg-data-dps data-[state=checked]:border-data-dps"
            />
            <span className="text-xs text-muted-foreground">贷款定音 (强制使用 32%)</span>
          </label>
        </div>

      </CardContent>
    </Card>
  );
}

/* ================================================================
   Sub-components
   ================================================================ */

function FlowBanner({ flow, onSwitch }: { flow: string; onSwitch: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-data-dps/10 rounded text-xs">
      <span className="text-data-dps">自动识别: {flow}</span>
      <Button variant="link" size="sm" onClick={onSwitch} className="text-data-dps hover:text-data-dps/80 h-auto p-0 text-xs">
        <RefreshCw className="w-3 h-3 mr-1" />切换
      </Button>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-data-dps">DPS 毕业率</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">无法从心法自动识别流派，请手动选择：</p>
        <Select value={localType} onValueChange={setLocalType}>
          <SelectTrigger className="bg-surface-section border-border">
            <SelectValue placeholder="请选择流派..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {availableFlows.map(ft => (
              <SelectItem key={ft} value={ft} className="focus:bg-data-dps/20 focus:text-data-dps">{ft}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setSelectedFlowType(localType || availableFlows[0])}
          className="w-full bg-data-dps hover:bg-data-dps/80 text-white"
        >
          确认流派
        </Button>
      </CardContent>
    </Card>
  );
}

function KV({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}


