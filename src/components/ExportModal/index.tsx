import { ModalOverlay, ModalProps } from '@/components/Modal';

type ExportModalProps = ModalProps & {
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
};

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  onImport
}: ExportModalProps) {
  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImport(file);
    }
  };

  return (
    <ModalOverlay>
      <div className="bg-gray-800 p-6 rounded-lg modal-enter max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">导出/导入数据</h2>
        <div className="space-y-4">
          <button
            onClick={onExport}
            className="w-full py-3 bg-green-500 text-gray-900 rounded-lg btn-hover"
          >
            导出数据
          </button>
          <label className="block w-full py-3 bg-blue-500/20 text-blue-400 rounded-lg text-center cursor-pointer hover:bg-blue-500/30">
            导入数据
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg">
          关闭
        </button>
      </div>
    </ModalOverlay>
  );
}