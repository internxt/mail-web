/* eslint-disable react-hooks/set-state-in-effect */
import { type ElementType, useEffect, useRef, type ReactNode, useState } from 'react';

interface TransitionProps {
  show: boolean;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  children: ReactNode;
  as?: ElementType;
  className?: string;
  unmount?: boolean;
}

export function Transition({
  show,
  enter = '',
  enterFrom = '',
  enterTo = '',
  leave = '',
  leaveFrom = '',
  leaveTo = '',
  children,
  as: Tag = 'div',
  className = '',
  unmount = true,
}: Readonly<TransitionProps>) {
  const [mounted, setMounted] = useState(show);
  const [classes, setClasses] = useState('');
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (show) {
      setMounted(true);

      setClasses(`${enter} ${enterFrom}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setClasses(`${enter} ${enterTo}`);
        });
      });
    } else {
      setClasses(`${leave} ${leaveFrom}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setClasses(`${leave} ${leaveTo}`);
        });
      });

      const el = ref.current;
      if (el) {
        const onEnd = () => {
          if (unmount) setMounted(false);
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
      }
    }
  }, [show]);

  if (!mounted && unmount) return null;

  return (
    <Tag ref={ref} className={`${className} ${classes}`.trim()}>
      {children}
    </Tag>
  );
}
