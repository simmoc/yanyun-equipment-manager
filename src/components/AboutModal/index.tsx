import { ModalOverlay, ModalProps } from '@/components/Modal';

const GITHUB_REPO = 'https://github.com/simmoc/yanyun-equipment-manager';

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
          <div className="pt-3 border-t border-gray-700 space-y-3">
            <div>
              <p className="text-gray-200 font-medium">开源声明</p>
              <p className="text-sm mt-1">本项目为开源项目，代码托管于 GitHub，欢迎 Star、提 Issue 或提交 PR。</p>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 mt-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                github.com/simmoc/yanyun-equipment-manager
              </a>
            </div>
            <div>
              <p className="text-gray-200 font-medium">数据保存说明</p>
              <p className="text-sm mt-1">装备数据默认保存在浏览器本地（localStorage），不会上传到服务器。若配置了数据库（PostgreSQL），角色、装备方案等数据会保存到数据库，但网易登录凭证数据不会保存到数据库。可随时通过导出功能备份数据。</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-4 px-4 py-2 bg-gray-700 rounded-lg">
          关闭
        </button>
      </div>
    </ModalOverlay>
  );
}
