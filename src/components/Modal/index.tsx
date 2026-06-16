export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    {children}
  </div>
);