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

const formatValue = (value: number, attrName: string): string => {
  if (configData?.affix_data) {
    const affixEntry = Object.values(configData.affix_data).find(
      a => a.name === attrName
    );

    if (affixEntry?.unit) {
      try {
        // 匹配 {0:...} 中的格式串
        const match = affixEntry.unit.match(/\{0:(.+?)\}/);
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
        return affixEntry.unit.replace('{0}', value.toString());
      } catch {
        // ignore
      }
    }
  }

  // 默认降级规则
  if (value >= 100) return Math.round(value).toString();
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
};

  return (
    <div className={`equipment-card-shell equipment-card-surface bg-gray-800 overflow-hidden border border-gray-700 transition ${equipment.is_wearing ? 'is-current' : ''}`}>
      <div className="equipment-card-cover" aria-hidden="true" />
      <div className="relative z-[1] p-3 border-b border-gray-700">
        <div className="flex gap-2.5">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-none">
            {equipImage ? (
              <img src={equipImage} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-base">⚔️</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="leading-tight">
              <TruncatedText className="text-gray-200 font-medium text-[13px] leading-tight">
                {equipment.name}
              </TruncatedText>
            </h3>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className="text-gray-500 text-[11px]">{SLOT_NAME_MAP[equipment.slot] || equipment.slot}</span>
              {equipment.level > 0 && (
                <span className="px-1 py-[1px] bg-blue-500/20 text-blue-400 text-[10px] rounded">
                  Lv.{equipment.level}
                </span>
              )}
              {equipment.suit_type && (
                <span className="px-1 py-[1px] bg-amber-500/20 text-amber-400 text-[10px] rounded leading-none">
                  {suitInfo?.short || equipment.suit_type}
                </span>
              )}
              {equipment.is_wearing && (
                <span className="px-1 py-[1px] bg-emerald-500/20 text-emerald-400 text-[10px] rounded">
                  已装备
                </span>
              )}
              {score > 0 && (
                <span className={`text-[10px] font-bold ${getScoreColor(score)}`}>
                  {score}分
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
              return (
                <div key={index} className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded ${rate >= 95 ? 'bg-green-500/20' : rate >= 80 ? 'bg-blue-500/20' : rate >= 60 ? 'bg-gray-700/30' : 'bg-gray-700/20'}`}>
                  <div className="flex flex-1 items-center gap-1 min-w-0">
                    {isMax && <span className="text-amber-400 text-[9px] mr-0.5">荐</span>}
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
      </div>

      {canEdit && (
        <div className="relative z-[1] grid grid-cols-3 border-t border-gray-700 text-[11px]">
          <button
            onClick={onEdit}
            className="py-2 text-gray-300 hover:bg-gray-700"
          >
            编辑
          </button>
          <button
            onClick={() => void (equipment.is_wearing ? onUnwear() : onWear())}
            className="py-2 text-emerald-300 hover:bg-gray-700 border-l border-gray-700"
          >
            {equipment.is_wearing ? '卸下' : '穿上'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('删除这件装备？')) void onDelete();
            }}
            className="py-2 text-red-300 hover:bg-gray-700 border-l border-gray-700"
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}
