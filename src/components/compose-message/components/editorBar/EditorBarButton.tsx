export interface EditorBarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export const EditorBarButton = ({ onClick, isActive, disabled, children }: EditorBarButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-pressed={isActive}
    className={`p-1 rounded transition-colors ${isActive ? 'bg-gray-10 text-primary' : 'hover:bg-gray-5 text-gray-60'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);
