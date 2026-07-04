'use client';

import { useState, useEffect } from 'react';
import type { Plan, Equipment, RolePanelData, FlowType } from '@/types';
import { FLOW_TYPES } from '@/types';
import { getGraduationColor, getGraduationLevel } from '@/lib/graduation';
import { calculateGraduationRate } from '@/lib/graduationCalculator';
import type { FlowConfigData, FlowSkillData, FlowRotationAction, GraduationCalcResult } from '@/lib/graduationCalculator';

interface Props {
  equipments: Equipment[];
  rolePanelData: RolePanelData | Record<string, any> | null;
  flowConfig: FlowConfigData;
  flowRotations: Record<string, { rotation: FlowRotationAction[] }>;
  flowSkills: Record<string, Record<string, FlowSkillData>>;
  selectedPlan?: Plan | null;
}

export default function GraduationResultCard({
  equipments,
  rolePanelData,
  flowConfig,
  flowRotations,
  flowSkills,
  selectedPlan,
}: Props) {
  const initialFlow = (selectedPlan?.flow_type && flowConfig?.flows?.[selectedPlan.flow_type])
    ? (selectedPlan.flow_type as FlowType)
    : FLOW_TYPES.find((f) => flowConfig?.flows?.[f]) || FLOW_TYPES[0];

  const [selectedFlow, setSelectedFlow] = useState<FlowType>(initialFlow);

  useEffect(() => {
    if (selectedPlan?.flow_type && flowConfig?.flows?.[selectedPlan.flow_type] && selectedPlan.flow_type !== selectedFlow) {
      setSelectedFlow(selectedPlan.flow_type as FlowType);
    }
  }, [selectedPlan?.flow_type, flowConfig?.flows]);

  const config = flowConfig?.flows?.[selectedFlow];
  const rotationKey = config?.rotation_key || selectedFlow;
  const skillKey = config?.skill_key || selectedFlow;

  const rotations = (flowRotations?.[rotationKey]?.rotation || []) as FlowRotationAction[];
  const skills = (flowSkills?.[skillKey] || {}) as Record<string, FlowSkillData>;

  const result: GraduationCalcResult | null = config && flowConfig?.season_stats
    ? calculateGraduationRate(selectedFlow, flowConfig, skills, rotations, rolePanelData, equipments)
    : null;

  if (!flowConfig || !flowRotations || !flowSkills) {
    return (
      <div className="surface-panel p-3">
        <h2 className="text-base font-bold mb-2 text-yellow-400">毕业率计算</h2>
        <p className="text-gray-400 text-sm">正在加载配置数据...</p>
      </div>
    );
  }

  return (
    <div className="surface-panel p-3">
      <h2 className="text-base font-bold mb-2 text-yellow-400">毕业率计算</h2>

      {/* 流派选择 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FLOW_TYPES.filter((f) => flowConfig.flows?.[f]).map((flow) => (
          <button
            key={flow}
            onClick={() => setSelectedFlow(flow)}
            className={`px-2 py-1 text-xs rounded transition ${
              selectedFlow === flow
                ? 'bg-yellow-500 text-gray-900 font-bold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {flow}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-3">
          {/* 主数字显示 */}
          <div className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-700/50 to-gray-800/50 p-4 rounded-lg">
            <div className="text-center">
              <div
                className="text-5xl font-black tracking-tight"
                style={{ color: getGraduationColor(result.graduationRate) }}
              >
                {result.graduationRate.toFixed(1)}
                <span className="text-2xl ml-0.5 text-gray-400">%</span>
              </div>
              <div className="text-xs mt-1" style={{ color: getGraduationColor(result.graduationRate) }}>
                {getGraduationLevel(result.graduationRate)}
              </div>
            </div>
          </div>

          {/* 核心指标 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-700/40 p-2 rounded">
              <div className="text-gray-400">实际总伤害</div>
              <div className="text-white font-bold text-sm">
                {(result.totalDamage / 10000).toFixed(2)} 万
              </div>
            </div>
            <div className="bg-gray-700/40 p-2 rounded">
              <div className="text-gray-400">目标伤害</div>
              <div className="text-white font-bold text-sm">
                {(result.baseline / 10000).toFixed(2)} 万
              </div>
            </div>
            <div className="bg-gray-700/40 p-2 rounded">
              <div className="text-gray-400">实战 ADPS</div>
              <div className="text-white font-bold text-sm">
                {(result.adps / 1000).toFixed(2)}k
              </div>
            </div>
            <div className="bg-gray-700/40 p-2 rounded">
              <div className="text-gray-400">战斗时长</div>
              <div className="text-white font-bold text-sm">
                {result.battleTime.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* 玩家属性 */}
          <div className="bg-gray-700/30 p-2 rounded-lg">
            <div className="text-xs font-bold mb-1.5 text-yellow-300">角色属性</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">外功</span>
                <span className="text-white">
                  {Math.round(result.playerStats.minOuter)} - {Math.round(result.playerStats.maxOuter)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{result.element}属攻</span>
                <span className="text-white">
                  {Math.round(result.playerStats.elementAttacks[result.element]?.avg || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">精准率</span>
                <span className="text-green-400">{(result.playerStats.preciseRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">会心率</span>
                <span className="text-yellow-400">{(result.playerStats.critRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">会意率</span>
                <span className="text-blue-400">{(result.playerStats.intentRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">首领增伤</span>
                <span className="text-orange-400">+{(result.playerStats.bossDmgBonus * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">全武学增效</span>
                <span className="text-purple-400">+{(result.playerStats.allArtsBonus * 100).toFixed(1)}%</span>
              </div>
              {Object.keys(result.playerStats.schoolBonuses).length > 0 && (
                <div className="col-span-2 flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(result.playerStats.schoolBonuses).map(([w, v]) =>
                    v > 0 ? (
                      <span
                        key={w}
                        className="bg-purple-900/40 text-purple-300 text-xs px-1.5 py-0.5 rounded"
                      >
                        {w}武学 +{(v * 100).toFixed(1)}%
                      </span>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 缺少数据提示 */}
          {result.missingData.length > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-2 rounded-lg text-xs text-yellow-300">
              注意：{result.missingData.join('；')}
            </div>
          )}

          {/* 技能明细（Top 10） */}
          {result.skillBreakdown.length > 0 && (
            <div className="bg-gray-700/20 p-2 rounded-lg">
              <div className="text-xs font-bold mb-1.5 text-orange-300 flex justify-between items-center">
                <span>技能伤害明细</span>
                <span className="text-gray-400 font-normal">共 {result.skillBreakdown.length} 个技能</span>
              </div>
              <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                {result.skillBreakdown
                  .sort((a, b) => b.totalDamage - a.totalDamage)
                  .slice(0, 10)
                  .map((skill, idx) => {
                    const pct = result.totalDamage > 0 ? (skill.totalDamage / result.totalDamage) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
                            skill.isDingyin ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-gray-200'
                          }`}
                          title={skill.isDingyin ? '定音技能' : '普通技能'}
                        >
                          {skill.count}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-gray-300">
                            <span className="truncate text-left" title={skill.name}>
                              {skill.name}
                            </span>
                            <span className="text-white font-medium ml-2 whitespace-nowrap">
                              {(skill.totalDamage / 1000).toFixed(1)}k
                            </span>
                          </div>
                          <div className="w-full h-1 bg-gray-700 rounded mt-0.5">
                            <div
                              className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
