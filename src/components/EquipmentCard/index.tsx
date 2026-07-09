import { useState } from 'react';
import type { Equipment, EquipmentSlot } from '@/types';
import { TruncatedText } from '@/components/TruncatedText';
import { getScoreColor, calcScore } from '@/lib/scoreConfig';

type ConfigData = {
  equip_data: Record<string, { id: number; name: string }>;
  suffix_data: Record<string, { name: string; short: string; icon: string }>;
  affix_data: Record<string, { name: string; need_add: string; unit: string }>;
  slot_data?: Record<string, { id: number; name: string; image: string }>;
};

type EquipmentCardProps = {
  equipment: Equipment;
  getEquipImageUrl: (name: string) => string | null;
  configData: ConfigData | null;
  onWear: () => Promise<void>;
  onUnwear: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: () => void;
};

const BUILT_IN_ATTRIBUTES = [
  'HP_MAX', 'W_DEF', 'ARCHER_DAMAGE', 'ARCHER_WEAKPOINT_DAMAGE'
];

const QUALITY_COLORS = {
  1: 'text-gray-400 bg-gray-600/30',
  2: 'text-blue-400 bg-blue-600/30',
  3: 'text-purple-400 bg-purple-600/30',
  4: 'text-orange-400 bg-orange-600/30',
  5: 'text-red-400 bg-red-600/30'
};

const QUALITY_LABELS = {
  1: '普通',
  2: '精良',
  3: '稀有',
  4: '史诗',
  5: '传说'
};

const SLOT_NAME_MAP: Record<string, string> = {
  '主武器': '武器',
  '副武器': '武器',
  '环': '环',
  '佩': '佩',
  '冠胄': '冠胄',
  '胸甲': '胸甲',
  '胫甲': '胫甲',
  '腕甲': '腕甲',
  '射决': '射决',
  '弓': '弓'
};

export function EquipmentCard({
  equipment,
  getEquipImageUrl,
  configData,
  onWear,
  onUnwear,
  onDelete,
  onEdit
}: EquipmentCardProps) {
  const equipImage = getEquipImageUrl(equipment.name);
  const canEdit = !equipment.id.startsWith('auth_equip_');
  const suitInfo = configData?.suffix_data
    ? Object.values(configData.suffix_data).find((s) => s.name === equipment.suit_type)
    : null;

  const attributes = equipment.attributes || [];

  const builtInAttributes = attributes.filter(attr =>
    BUILT_IN_ATTRIBUTES.some(builtIn =>
      attr.name.includes(builtIn) || builtIn.includes(attr.name)
    )
  );

  const affixAttributes = attributes.filter(attr =>
    !BUILT_IN_ATTRIBUTES.some(builtIn =>
      attr.name.includes(builtIn) || builtIn.includes(attr.name)
    )
  );

  const score = calcScore(attributes);

  const [retoneHover, setRetoneHover] = useState(false);
  const [retonePinned, setRetonePinned] = useState(false);

  // 调律目标词条编号集合：被调律换出来的当前词条
  const retoneTargetIds = new Set<number>();
  if (equipment.retone?.affixHistory) {
    for (const rec of equipment.retone.affixHistory) {
      rec.affixIds.forEach(id => retoneTargetIds.add(id));
    }
  }
  const hasRetone = !!equipment.retone;
  const showRetonePanel = hasRetone && (retoneHover || retonePinned);

const formatByUnit = (unit: string | undefined, value: number): string => {
  if (unit) {
    try {
      // 匹配 {0:...} 中的格式串
      const match = unit.match(/\{0:(.+?)\}/);
      if (match) {
        const fmt = match[1];

        // 百分比：{0:.1%} => value * 100 + "%"
        if (fmt.endsWith('%')) {
          const decimals = parseInt(fmt.match(/\.(\d+)%/)?.[1] ?? '2', 10);
          return (value * 100).toFixed(decimals) + '%';
        }

        // 定点数：{0:.1f}
        if (fmt.endsWith('f')) {
          const decimals = parseInt(fmt.match(/\.(\d+)f/)?.[1] ?? '2', 10);
          return value.toFixed(decimals);
        }

        // 整数：{0:d} / {0:0}
        if (fmt === 'd' || fmt === '0') {
          return Math.round(value).toString();
        }

        // 小数位控制：{.1} / {.2}
        if (fmt.startsWith('.')) {
          const decimals = parseInt(fmt.slice(1), 10);
          if (!Number.isNaN(decimals)) {
            return value.toFixed(decimals);
          }
        }
      }

      // 兜底：普通替换 {0}
      return unit.replace('{0}', value.toString());
    } catch {
      // ignore
    }
  }

  // 默认降级规则
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
};

const formatValue = (value: number, attrName: string): string => {
  if (configData?.affix_data) {
    const affixEntry = Object.values(configData.affix_data).find(
      a => a.name === attrName
    );
    if (affixEntry?.unit) {
      return formatByUnit(affixEntry.unit, value);
    }
  }
  return formatByUnit(undefined, value);
};

// 按词条编号查名称
const getAffixName = (id: number): string => {
  const info = configData?.affix_data?.[String(id)];
  return info?.name || `词条${id}`;
};

// 按词条编号格式化数值（更精确，避免同名词条歧义）
const formatValueById = (id: number, value: number): string => {
  const info = configData?.affix_data?.[String(id)];
  return formatByUnit(info?.unit, value);
};

  return (
    <div className={`equipment-card-shell equipment-card-surface bg-gray-800 overflow-hidden border border-gray-700 transition ${equipment.is_wearing ? 'is-current' : ''}`}>
      <div className="equipment-card-cover" aria-hidden="true" />
      <div className="relative z-[1] equipment-card-header border-b border-gray-700">
        <div className="equipment-card-topline">
          <div className="equipment-thumb">
            {equipImage ? (
              <img src={equipImage} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-base">⚔️</span>
            )}
            {score > 0 && (
              <span className={`equipment-score-badge ${getScoreColor(score)}`}>
                {score}
              </span>
            )}
          </div>
          <div className="equipment-title-area">
            <div className="equipment-title-row">
              <h3 className="equipment-title">
                <TruncatedText className="text-gray-200 font-semibold text-[13px] leading-tight">
                  {equipment.name}
                </TruncatedText>
              </h3>
              {equipment.is_wearing && (
                <span className="equipment-status-chip">穿着</span>
              )}
            </div>
            <div className="equipment-meta-line">
              <span className="equipment-meta-chip slot">{SLOT_NAME_MAP[equipment.slot] || equipment.slot}</span>
              {equipment.level > 0 && <span className="equipment-meta-chip level">Lv.{equipment.level}</span>}
              {equipment.suit_type && <span className="equipment-meta-chip suit">{suitInfo?.short || equipment.suit_type}</span>}
              {equipment.legacyTs != null && equipment.legacyTs > 0 && (
                <span className="equipment-meta-chip legacy" title={`传承于 ${new Date(equipment.legacyTs * 1000).toLocaleDateString('zh-CN')}`}>
                  承音
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] px-3 py-2.5 space-y-2">
        {builtInAttributes.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] text-gray-500">基础属性</div>
            {builtInAttributes.map((attr, index) => (
              <div key={index} className="flex items-center justify-between gap-2 px-1.5 py-1 bg-gray-700/30 rounded">
                <span className="text-gray-300 text-[11px]">{attr.name}</span>
                <span className="text-green-400 text-[11px] font-medium">{formatValue(attr.value, attr.name)}</span>
              </div>
            ))}
          </div>
        )}
        {affixAttributes.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] text-gray-500">词条</div>
            {affixAttributes.map((attr, index) => {
              const quality = attr.quality || 3;
              const rate = attr.rate || 0;
              const isMax = attr.is_main;
              const affixColor = getScoreColor(rate);
              const isRetoned = attr.affixId != null && retoneTargetIds.has(attr.affixId);
              return (
                <div key={index} className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded ${rate >= 95 ? 'bg-green-500/20' : rate >= 80 ? 'bg-blue-500/20' : rate >= 60 ? 'bg-gray-700/30' : 'bg-gray-700/20'}`}>
                  <div className="flex flex-1 items-center gap-1 min-w-0">
                    {isMax && <span className="text-amber-400 text-[9px] mr-0.5">荐</span>}
                    {isRetoned && (
                      <button
                        type="button"
                        onMouseEnter={() => setRetoneHover(true)}
                        onMouseLeave={() => setRetoneHover(false)}
                        onClick={(e) => { e.stopPropagation(); setRetonePinned(p => !p); }}
                        className={`px-1 py-[1px] rounded text-[9px] leading-none flex-shrink-0 ${retonePinned || retoneHover ? 'bg-cyan-500/40 text-cyan-300' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'}`}
                        title="转率信息"
                      >
                        转
                      </button>
                    )}
                    <TruncatedText className={`${affixColor} text-[11px]`}>
                      {attr.name}
                    </TruncatedText>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`${affixColor} text-[11px] font-medium`}>{formatValue(attr.value, attr.name)}</span>
                    {rate > 0 && (
                      <span className={`${affixColor} text-[7px] leading-none`}>
                        {rate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {builtInAttributes.length === 0 && affixAttributes.length === 0 && (
          <div className="text-gray-500 text-[11px] text-center py-1.5">
            无词条信息
          </div>
        )}
        {showRetonePanel && (
          <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm rounded p-2 space-y-1.5 overflow-auto pointer-events-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                <span>转率</span>
                {equipment.retone!.retoned > 0 && (
                  <span className="px-1 py-[1px] bg-cyan-500/20 text-cyan-400 rounded text-[9px] leading-none">
                    ×{equipment.retone!.retoned}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setRetonePinned(false); setRetoneHover(false); }}
                className="text-gray-500 text-[11px] leading-none hover:text-gray-300 px-1 pointer-events-auto"
                title="关闭"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-0.5 px-1">
              {equipment.retone!.rawAffixId != null && (
                <li className="text-[11px] text-gray-300">
                  {getAffixName(equipment.retone!.rawAffixId)}
                </li>
              )}
              {equipment.retone!.affixHistory?.map((rec, i) => (
                <li key={`rh${i}`} className="text-[11px]">
                  <span className="text-gray-500">→ </span>
                  <span className="text-cyan-400">
                    {rec.affixIds.map(id => getAffixName(id)).join(' / ')}
                  </span>
                </li>
              ))}
            </ul>
            {equipment.retone!.nextRetoneTs != null && equipment.retone!.nextRetoneTs > 0 && (
              <div className="flex items-center justify-between gap-2 px-1.5 py-1 bg-gray-700/30 rounded">
                <span className="text-gray-500 text-[10px]">下次转率</span>
                <span className="text-gray-400 text-[10px]">
                  {new Date(equipment.retone!.nextRetoneTs * 1000).toLocaleString('zh-CN', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="relative z-[1] grid grid-cols-2 border-t border-gray-700 text-[11px]">
          <button
            onClick={() => void (equipment.is_wearing ? onUnwear() : onWear())}
            className="py-2 text-emerald-300 hover:bg-gray-700"
          >
            {equipment.is_wearing ? '卸下' : '穿上'}
          </button>
          <button
            onClick={() => {
              if (equipment.is_wearing) return;
              if (window.confirm('删除这件装备？')) void onDelete();
            }}
            disabled={equipment.is_wearing}
            className={`py-2 border-l border-gray-700 ${equipment.is_wearing ? 'text-gray-600 cursor-not-allowed' : 'text-red-300 hover:bg-gray-700'}`}
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}
