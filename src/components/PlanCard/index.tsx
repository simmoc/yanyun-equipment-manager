import type { Plan } from '@/types';

type PlanCardProps = {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
  gradationResults: any[];
};

export function PlanCard({
  plan,
  isSelected,
  onSelect,
  onDelete,
  gradationResults
}: PlanCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-transparent bg-gray-800 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-200">{plan.name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-500 hover:text-red-400 transition"
        >
          🗑️
        </button>
      </div>
      <div className="text-sm text-gray-400 space-y-1">
        <p>{plan.flow_type} · {plan.version}</p>
        <p>{plan.suit_type} · {plan.bow_type}</p>
        {plan.loan_dingyin && <p className="text-amber-400">借用钉音</p>}
      </div>
      {isSelected && gradationResults.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">毕业进度</p>
          <div className="space-y-1">
            {gradationResults.slice(0, 3).map((result, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{result.slot}:</span>
                <span className="ml-2">{result.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}