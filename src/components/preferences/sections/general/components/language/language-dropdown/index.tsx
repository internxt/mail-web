import { type ReactNode } from 'react';

const LanguageDropdown = ({
  isOpen,
  title,
  menuItems,
  onToggle,
}: {
  isOpen: boolean;
  title: ReactNode;
  menuItems: ReactNode[];
  onToggle: () => void;
}) => {
  return (
    <div className="flex flex-col overflow-hidden dark:bg-gray-5">
      <button
        type="button"
        className="flex w-full items-center text-base transition-all duration-75 ease-in-out"
        onClick={onToggle}
      >
        {title}
      </button>

      {isOpen && (
        <div className="flex flex-col">
          {menuItems.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
