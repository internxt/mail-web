import { CaretLeftIcon } from '@phosphor-icons/react';
import { type ReactNode } from 'react';

interface SectionProps {
  className?: string;
  children: ReactNode;
  title: string;
  onBackButtonClicked?: () => void;
}

const PreferenceSectionLayout = ({ className = '', children, title, onBackButtonClicked }: Readonly<SectionProps>) => {
  return (
    <div className={`${className} space-y-2`}>
      <div className="flex flex-row space-x-4 ">
        {onBackButtonClicked && (
          <button onClick={onBackButtonClicked}>
            <div className="text-gray-100">
              <CaretLeftIcon size={22} />
            </div>
          </button>
        )}
        <span className="text-lg font-medium text-gray-100">{title}</span>
      </div>
      {children}
    </div>
  );
};

export default PreferenceSectionLayout;
