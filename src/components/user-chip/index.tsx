import { UserCheap } from '@internxt/ui';
import { XIcon } from '@phosphor-icons/react';
import { useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

interface UserChipProps {
  avatar?: string;
  name: string;
  email: string;
  onRemove?: () => void;
}

const UserChip = ({ avatar, name, email, onRemove }: UserChipProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const handleMouseEnter = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom, left: rect.left });
  };

  const handleOnRemove = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    setPosition(null);
    onRemove?.();
  };

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPosition(null)}
      role="tooltip"
      aria-describedby={position ? tooltipId : undefined}
    >
      <div className="flex flex-row gap-0.5 items-center px-2 py-1 rounded-md bg-gray-5 cursor-default">
        <span className="text-sm font-medium text-gray-60">{name.split(' ')[0]}</span>
        {onRemove && (
          <XIcon
            className={`flex transition-opacity duration-100 ${position ? 'opacity-100' : 'opacity-0'}`}
            size={14}
            onClick={handleOnRemove}
            weight="bold"
          />
        )}
      </div>

      {position &&
        createPortal(
          <div id={tooltipId} role="tooltip" className="fixed z-10" style={{ top: position.top, left: position.left }}>
            <UserCheap avatar={avatar} fullName={name} email={email} />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default UserChip;
