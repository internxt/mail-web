export interface SectionItemProps {
  text: string;
  isActive?: boolean;
  isSection?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

const SectionItem = ({ text, isActive, isDisabled, isSection, onClick }: SectionItemProps) => {
  const isClickable = !!onClick && !isDisabled;
  const clickableContainerClass = isClickable ? 'hover:bg-gray-5' : '';
  const activeContainerClass = isActive ? 'bg-primary' : clickableContainerClass;
  const containerClass = isDisabled ? '' : activeContainerClass;
  const clickableClass = isClickable ? 'hover:cursor-pointer' : '';
  const activeTextClass = isActive ? 'text-white' : 'text-gray-80';
  const disabledTextClass = isDisabled ? 'text-gray-40' : activeTextClass;
  const sectionTextClass = isSection ? 'font-semibold' : '';

  const Element = isClickable ? 'button' : 'div';

  return (
    <Element
      className={`flex h-10 w-full items-center justify-between rounded-lg px-3 py-2
       ${clickableClass} ${containerClass}`}
      onClick={isDisabled ? undefined : onClick}
      {...(isClickable ? { type: 'button' as const } : {})}
    >
      <div className="flex items-center">
        <span className={`text-base font-normal ${disabledTextClass} ${sectionTextClass}`}>{text}</span>
      </div>
    </Element>
  );
};

export default SectionItem;
