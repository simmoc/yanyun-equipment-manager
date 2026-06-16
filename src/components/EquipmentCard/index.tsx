import type { Equipment, EquipmentSlot } from '@/types';

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
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition group">
      <div className="p-3 border-b border-gray-700">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center flex-none">
            {equipImage ? (
              <img src={equipImage} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-xl">⚔️</span>
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="text-gray-200 font-semibold text-sm truncate">{equipment.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-gray-500 text-xs whitespace-nowrap">{SLOT_NAME_MAP[equipment.slot] || equipment.slot}</span>
              {equipment.level > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded whitespace-nowrap">
                  Lv.{equipment.level}
                </span>
              )}
              {equipment.suit_type && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded whitespace-nowrap">
                  {suitInfo?.short || equipment.suit_type}
                </span>
              )}
              {equipment.is_wearing && (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded whitespace-nowrap">
                  已装备
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        {affixAttributes.length > 0 ? (
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">词条</div>
            {affixAttributes.map((attr, index) => {
              const quality = attr.quality || 3;
              const rate = attr.rate || 0;
              const isMax = attr.is_main;
              return (
                <div key={index} className="flex items-center justify-between px-2 py-1.5 bg-gray-700/30 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-xs">{attr.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-xs font-medium">{formatValue(attr.value, attr.name)}</span>
                    {rate > 0 && (
                      <span className={`text-[10px] ${isMax ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {rate.toFixed(1)}%{isMax ? ' 满' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-xs text-center py-2">
            无词条信息
          </div>
        )}
      </div>

      <div className="px-3 pb-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        {equipment.is_wearing ? (
          <button
            onClick={onUnwear}
            className="flex-1 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-xs"
          >
            卸下
          </button>
        ) : (
          <button
            onClick={onWear}
            className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition text-xs"
          >
            装备
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-xs"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-gray-700 text-gray-400 rounded-lg hover:bg-red-500/30 hover:text-red-400 transition text-xs"
        >
          删除
        </button>
      </div>
    </div>
  );
}
