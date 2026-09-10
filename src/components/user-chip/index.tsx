import UserHoverCard from '@/components/user-hover-card';
import { XIcon } from '@phosphor-icons/react';
import type { MouseEvent } from 'react';

interface UserChipProps {
  avatar?: string;
  name: string;
  email: string;
  onRemove?: () => void;
}

const UserChip = ({ avatar, name, email, onRemove }: UserChipProps) => {
  const normalizedName = name.trim();
  const userName = normalizedName ? normalizedName.split(/\s+/)[0] : email.split('@')[0];

  const handleOnRemove = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <UserHoverCard avatar={avatar} name={name} email={email}>
      {(isHovered) => (
        <div className="flex flex-row gap-0.5 items-center px-2 py-1 rounded-md bg-gray-5 cursor-default">
          <span className="text-sm font-medium text-gray-60">{userName}</span>
          {onRemove && (
            <XIcon
              className={`flex transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              size={14}
              onClick={handleOnRemove}
              weight="bold"
            />
          )}
        </div>
      )}
    </UserHoverCard>
  );
};

export default UserChip;
