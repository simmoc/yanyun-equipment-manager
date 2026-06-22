'use client';

import { useMemo } from 'react';
import type { Plan, RolePanelData } from '@/types';
import {
  DPSGraduationCalculator,
  FLOW_TO_SCHOOL_KEY,
  ELEMENT_NAMES,
  type UserEquipment,
} from '@/lib/dpsCalculator';
import { SCHOOL_REF_DATA } from '@/lib/dpsReferenceData';

// ─────────────────────────────────────────────
// RolePanelData field → element name mapping
// ─────────────────────────────────────────────
const PANEL_FIELD_MAP: Record<string, { min: string; max: string }> = {
  '外功': { min: 'MIN_W_ATK', max: 'MAX_W_ATK' },
  '鸣金': { min: 'MIN_PRO_ATK_A', max: 'MAX_PRO_ATK_A' },
  '牵丝': { min: 'MIN_PRO_ATK_B', max: 'MAX_PRO_ATK_B' },
  '裂石': { min: 'MIN_PRO_ATK_C', max: 'MAX_PRO_ATK_C' },
  '破竹': { min: 'MIN_PRO_ATK_E', max: 'MAX_PRO_ATK_E' },
};

// ─────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────
interface DPSGraduationPanelProps {
  rolePanelData: RolePanelData | null;
  selectedPlan: Plan | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Extract element attack values from role panel data */
function extractUserEquipment(panel: RolePanelData): UserEquipment {
  const equipment: UserEquipment = {};

  for (const elemName of ELEMENT_NAMES) {
    const mapping = PANEL_FIELD_MAP[elemName];
    if (!mapping) continue;

    const minRaw = (panel as any)[mapping.min];
    const maxRaw = (panel as any)[mapping.max];

    if (minRaw != null || maxRaw != null) {
      const minVal = parseFloat(minRaw) || 0;
      const maxVal = parseFloat(maxRaw) || 0;
      if (minVal > 0 || maxVal > 0) {
        equipment[elemName] = { min: minVal, max: maxVal };
      }
    }
  }

  return equipment;
}

/** Get graduation rate color */
function getRateColor(rate: number): string {
  if (rate >= 0.95) return '#4ade80'; // green
  if (rate >= 0.85) return '#a3e635'; // lime
  if (rate >= 0.70) return '#facc15'; // yellow
  if (rate >= 0.50) return '#fb923c'; // orange
  return '#f87171'; // red
}

/** Get graduation level label */
function getRateLabel(rate: number): string {
  if (rate >= 0.95) return '完美毕业';
  if (rate >= 0.85) return '优秀';
  if (rate >= 0.70) return '良好';
  if (rate >= 0.50) return '入门';
  return '未达标';
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function DPSGraduationPanel({
  rolePanelData,
  selectedPlan,
}: DPSGraduationPanelProps) {
  const result = useMemo(() => {
    if (!rolePanelData || !selectedPlan) return null;

    const flowType = selectedPlan.flow_type;
    const schoolKey = FLOW_TO_SCHOOL_KEY[flowType];
    if (!schoolKey) return { error: `流派 "${flowType}" 暂无 DPS 参考数据` };

    const schoolRef = SCHOOL_REF_DATA[schoolKey];
    if (!schoolRef) return { error: `流派 "${schoolKey}" 参考数据未加载` };

    const equipment = extractUserEquipment(rolePanelData);
    if (Object.keys(equipment).length === 0) {
      return { error: '角色面板数据中未找到攻击属性' };
    }

    try {
      const calc = new DPSGraduationCalculator(schoolKey, schoolRef);
      const res = calc.calculate({ equipment });
      return { calc, res, schoolKey };
    } catch (e: any) {
      return { error: `计算失败: ${e.message}` };
    }
  }, [rolePanelData, selectedPlan]);

  // ── No data states ──
  if (!selectedPlan) {
    return (
      <div className="bg-gray-800/50 p-3 rounded-lg">
        <h2 className="text-base font-bold mb-2 text-purple-400">DPS 毕业率</h2>
        <div className="text-center py-3 text-gray-500 text-sm">
          请先选择方案
        </div>
      </div>
    );
  }

  if (!rolePanelData) {
    return (
      <div className="bg-gray-800/50 p-3 rounded-lg">
        <h2 className="text-base font-bold mb-2 text-purple-400">DPS 毕业率</h2>
        <div className="text-center py-3 text-gray-500 text-sm">
          暂无角色面板数据
        </div>
      </div>
    );
  }

  if (!result || 'error' in result) {
    return (
      <div className="bg-gray-800/50 p-3 rounded-lg">
        <h2 className="text-base font-bold mb-2 text-purple-400">DPS 毕业率</h2>
        <div className="text-center py-3 text-gray-500 text-sm">
          {result?.error || '计算失败'}
        </div>
      </div>
    );
  }

  // ── Main display ──
  const { res } = result;
  const rate = res.毕业率数值;
  const color = getRateColor(rate);
  const label = getRateLabel(rate);
  const ratePercent = +(rate * 100).toFixed(1);
  const barWidth = Math.min(100, Math.max(0, rate * 100));

  return (
    <div className="bg-gray-800/50 p-3 rounded-lg">
      <h2 className="text-base font-bold mb-3 text-purple-400">DPS 毕业率</h2>

      <div className="space-y-3">
        {/* 毕业率主指标 */}
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">毕业率</span>
            <span
              className="text-2xl font-bold"
              style={{ color }}
            >
              {res.毕业率}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2.5 bg-gray-600 rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${barWidth}%`,
                backgroundColor: color,
              }}
            />
          </div>

          <div className="flex justify-between text-xs">
            <span style={{ color }}>{label}</span>
            <span className="text-gray-500">{res.流派} · {res.模式}</span>
          </div>
        </div>

        {/* DPS 对比 */}
        <div className="bg-gray-700/50 p-2 rounded-lg">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">当前 DPS</span>
              <span className="text-sm font-medium text-white">
                {res.DPS.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">毕业档 DPS</span>
              <span className="text-sm font-medium text-green-300">
                {res.毕业档DPS.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">战斗时间</span>
              <span className="text-sm text-gray-300">
                {res.战斗时间}s
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">期望总伤</span>
              <span className="text-sm text-gray-300">
                {(res.总期望伤害 / 10000).toFixed(1)}万
              </span>
            </div>
          </div>
        </div>

        {/* 攻击值概览 */}
        <DPSAttackOverview panelData={rolePanelData} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Attack value overview sub-component
// ─────────────────────────────────────────────
function DPSAttackOverview({ panelData }: { panelData: RolePanelData }) {
  return (
    <div className="bg-gray-700/50 p-2 rounded-lg">
      <div className="text-xs font-medium mb-1.5 text-blue-300">攻击值概览 (角色面板数据)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {ELEMENT_NAMES.map(elemName => {
          const mapping = PANEL_FIELD_MAP[elemName];
          if (!mapping) return null;
          const minVal = parseFloat((panelData as any)[mapping.min]) || 0;
          const maxVal = parseFloat((panelData as any)[mapping.max]) || 0;
          if (minVal === 0 && maxVal === 0) return null;

          const colorMap: Record<string, string> = {
            '外功': 'text-red-300',
            '鸣金': 'text-yellow-300',
            '裂石': 'text-orange-300',
            '牵丝': 'text-green-300',
            '破竹': 'text-blue-300',
          };

          return (
            <div key={elemName} className="flex justify-between items-center gap-1">
              <span className="text-xs text-gray-500">{elemName}</span>
              <span className={`text-xs font-medium ${colorMap[elemName] || 'text-gray-300'}`}>
                {minVal.toLocaleString()} ~ {maxVal.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
