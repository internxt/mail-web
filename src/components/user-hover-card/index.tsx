import { UserCheap } from '@internxt/ui';
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const CARD_GAP = 4;
const VIEWPORT_MARGIN = 8;

const CARD_OVERRIDES = '[&>div]:max-w-96 [&_p]:overflow-visible [&_p]:whitespace-normal [&_p]:break-words';

interface UserHoverCardProps {
  avatar?: string;
  name: string;
  email: string;
  className?: string;
  children: ReactNode | ((isHovered: boolean) => ReactNode);
}

const UserHoverCard = ({ avatar, name, email, className, children }: UserHoverCardProps) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardId = useId();
  const fullUserName = name.trim() || email;

  const showCard = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + CARD_GAP, left: rect.left });
    setAnchor(rect);
  };

  const hideCard = () => setAnchor(null);

  useLayoutEffect(() => {
    if (!anchor || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    const fitsBelow = anchor.bottom + CARD_GAP + height <= window.innerHeight - VIEWPORT_MARGIN;

    setPosition({
      top: fitsBelow ? anchor.bottom + CARD_GAP : Math.max(VIEWPORT_MARGIN, anchor.top - CARD_GAP - height),
      left: Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, window.innerWidth - width - VIEWPORT_MARGIN)),
    });
  }, [anchor]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className ?? ''}`}
      onMouseEnter={showCard}
      onMouseLeave={hideCard}
      aria-describedby={anchor ? cardId : undefined}
    >
      {typeof children === 'function' ? children(!!anchor) : children}

      {anchor &&
        createPortal(
          <div
            ref={cardRef}
            id={cardId}
            role="tooltip"
            className={`fixed z-10 ${CARD_OVERRIDES}`}
            style={{ top: position.top, left: position.left }}
          >
            <UserCheap avatar={avatar} fullName={fullUserName} email={email} />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default UserHoverCard;
