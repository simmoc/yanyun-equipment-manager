import { ModalOverlay, ModalProps } from '@/components/Modal';

type NewCharacterModalProps = ModalProps & {
  newCharacterName: string;
  setNewCharacterName: (name: string) => void;
  onSubmit: () => Promise<void>;
};

export function NewCharacterModal({
  isOpen,
  onClose,
  newCharacterName,
  setNewCharacterName,
  onSubmit
}: NewCharacterModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">新建角色</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">角色名称</label>
            <input
              type="text"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              placeholder="输入角色名称"
              className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={onSubmit}
              disabled={!newCharacterName}
              className="flex-1 py-2 bg-emerald-500 text-gray-900 rounded-lg btn-hover disabled:opacity-50"
            >
              创建
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 rounded-lg"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}