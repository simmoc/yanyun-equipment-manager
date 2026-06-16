import { ModalOverlay, ModalProps } from '@/components/Modal';

type ImportCapturedModalProps = ModalProps & {
  capturedData: any;
  importLoading: boolean;
  onConfirm: () => Promise<void>;
};

const ATTR_NAME_MAP: Record<string, string> = {
  'CON': '体质',
  'STR': '劲力',
  'CRI': '机敏',
  'BAS': '气势',
  'AGI': '御劲',
  'HP_MAX': '气血上限',
  'MIN_W_ATK': '最小外功攻击',
  'MAX_W_ATK': '最大外功攻击',
  'W_ATK': '外功攻击',
  'W_DEF': '外功防御',
  'W_ATK_CRI_UP': '会心伤害加成',
  'HEAL_CRI_UP': '会心治疗加成',
  'W_ATK_CRI_UP_RDC': '会心伤害减免',
  'BASH_UP': '会意伤害加成',
  'BASH_UP_RDC': '会意伤害减免',
  'W_ATK_SCALE': '外功伤害加成',
  'W_DEF_SCALE': '外功伤害减免',
  'W_HEAL_SCALE': '外功治疗加成',
  'XIUWEI_KUNGFU': '武林造诣',
  'XIUWEI_TRADE': '营生造诣',
  'XIUWEI_EXPLORE': '探索造诣',
  'W_ATK_PEN': '外功穿透',
  'W_ATK_PEN_RDC': '外功抗性',
  'DAMAGE_REDUCE': '伤害减免',
  'CRI_PROB': '会心率',
  'BASH_PROB': '会意率',
  'ACR_PROB': '精准率',
  'ARCHER_DAMAGE': '弓箭基础伤害',
  'ARCHER_WEAKPOINT_DAMAGE': '弓箭弱点命中伤害'
};

const SLOT_NAME_MAP: Record<string, string> = {
  '1': '武器',
  '2': '武器',
  '3': '冠胄',
  '4': '胸甲',
  '5': '胫甲',
  '8': '腕甲',
  '9': '射决',
  '10': '环',
  '11': '佩',
  '21': '弓'
};

export function ImportCapturedModal({
  isOpen,
  onClose,
  capturedData,
  importLoading,
  onConfirm
}: ImportCapturedModalProps) {
  if (!isOpen || !capturedData) return null;

  const realAttr = capturedData.character_info?.real_attr || {};

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">导入捕获装备</h2>
        
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-2">
            角色: {capturedData.character_info?.base?.nickname || '未知'}
          </p>
          <p className="text-gray-400 text-sm mb-2">
            装备数量: {capturedData.character_info?.equipments?.length || 0}
          </p>
        </div>

        {Object.keys(realAttr).length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">面板属性</h3>
            <div className="bg-gray-700/50 p-3 rounded space-y-1">
              {Object.entries(realAttr).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-400">{key} ({ATTR_NAME_MAP[key] || key})</span>
                <span className="text-green-400">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {capturedData.character_info?.xinfa && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">心法配置</h3>
            <div className="bg-gray-700/50 p-3 rounded space-y-2">
              {capturedData.character_info.xinfa.active && capturedData.character_info.xinfa.active.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">主动心法</div>
                  <div className="flex flex-wrap gap-2">
                    {capturedData.character_info.xinfa.active.map((xinfa: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {xinfa.name || `心法${xinfa.id}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {capturedData.character_info.xinfa.passive && capturedData.character_info.xinfa.passive.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">被动心法</div>
                  <div className="flex flex-wrap gap-2">
                    {capturedData.character_info.xinfa.passive.map((xinfa: any, index: number) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                        {xinfa.name || `心法${xinfa.id}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {(capturedData.character_info?.equipments || []).map((equip: any, index: number) => (
            <div key={index} className="bg-gray-700/50 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">{SLOT_NAME_MAP[equip.slot] || `部位 ${equip.slot}`}</span>
                  <span className="text-gray-500 text-xs">{equip.name}</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                  {equip.suffix_name || '无套装'}
                </span>
              </div>
              
              {equip.base_attrs && Object.keys(equip.base_attrs).length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] text-gray-500 uppercase mb-1">基础属性</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(equip.base_attrs).map(([attrKey, attrValue]) => (
                    <span key={attrKey} className="text-xs text-gray-400">
                      {attrKey}: {String(attrValue)}
                    </span>
                  ))}
                  </div>
                </div>
              )}
              
              {equip.base_affixes && equip.base_affixes.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">词条</div>
                  <div className="space-y-1">
                    {equip.base_affixes.map((affix: any, affixIndex: number) => (
                      <div key={affixIndex} className="flex justify-between text-xs bg-gray-600/30 px-2 py-1 rounded">
                        <span className="text-gray-300">{affix.name || `词条${affix.id}`}</span>
                        <span className="text-green-400">{affix.value} ({affix.rate}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            disabled={importLoading}
            className="flex-1 py-3 bg-green-500 text-gray-900 rounded-lg btn-hover disabled:opacity-50"
          >
            {importLoading ? '导入中...' : '确认导入'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}