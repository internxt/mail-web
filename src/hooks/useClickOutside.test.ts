import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useRef } from 'react';
import { useClickOutside } from './useClickOutside';

describe('Click outside - Custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When clicking outside the ref element, then the function should be called', () => {
    const onClickOutside = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'));
      useClickOutside(ref, onClickOutside);
      return ref;
    });

    document.body.appendChild(result.current.current!);

    const outsideElement = document.createElement('button');
    document.body.appendChild(outsideElement);
    outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickOutside).toHaveBeenCalledOnce();

    document.body.removeChild(result.current.current!);
    document.body.removeChild(outsideElement);
  });

  test('When clicking inside the ref element, then it should do nothing', () => {
    const onClickOutside = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'));
      useClickOutside(ref, onClickOutside);
      return ref;
    });

    document.body.appendChild(result.current.current!);

    result.current.current!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickOutside).not.toHaveBeenCalled();

    document.body.removeChild(result.current.current!);
  });

  test('When ref is null, then it should do nothing', () => {
    const onClickOutside = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, onClickOutside);
    });

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  test('When the hook unmounts, then it should remove the event listener', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const onClickOutside = vi.fn();

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(document.createElement('div'));
      useClickOutside(ref, onClickOutside);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});
