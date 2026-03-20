import { UserCheap } from '@internxt/ui';
import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface UserChipProps {
  avatar?: string;
  name: string;
  email: string;
}

const UserChip = ({ avatar, name, email }: UserChipProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const handleMouseEnter = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom, left: rect.left });
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
      <span className="cursor-default rounded-md bg-gray-5 px-2 py-1 text-sm font-medium text-gray-60">
        {name.split(' ')[0]}
      </span>

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
