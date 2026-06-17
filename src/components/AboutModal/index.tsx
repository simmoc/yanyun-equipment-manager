import { ModalOverlay, ModalProps } from '@/components/Modal';

export function AboutModal({
  isOpen,
  onClose
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">关于</h2>
        <div className="space-y-3 text-gray-400">
          <p>这是一个用于管理《燕云十六声》装备毕业情况的工具。</p>
          <p>你可以：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>创建角色和方案</li>
            <li>添加装备并跟踪毕业进度</li>
            <li>导出数据进行备份</li>
          </ul>
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg">
          关闭
        </button>
      </div>
    </ModalOverlay>
  );
}