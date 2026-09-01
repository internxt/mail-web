import { describe, test, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useRecipientInput } from './useRecipientInput';
import type { Recipient } from '../types';

const createParams = (recipients: Recipient[] = []) => ({
  recipients,
  onAddRecipient: vi.fn(),
  onRemoveRecipient: vi.fn(),
});

const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as KeyboardEvent<HTMLInputElement>;

const pasteEvent = (text: string) =>
  ({
    clipboardData: { getData: () => text },
    preventDefault: vi.fn(),
  }) as unknown as ClipboardEvent<HTMLInputElement>;

describe('Typing and pasting recipients', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When a comma separated list is pasted, then every address is added and the input is emptied', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onPaste(pasteEvent('alice@example.com, bob@example.com')));

    expect(params.onAddRecipient).toHaveBeenCalledTimes(2);
    expect(params.onAddRecipient).toHaveBeenCalledWith('alice@example.com');
    expect(params.onAddRecipient).toHaveBeenCalledWith('bob@example.com');
    expect(result.current.inputValue).toBe('');
  });

  test('When a list is pasted on top of a half typed address, then the typed text completes the first address', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('ali'));
    act(() => result.current.onPaste(pasteEvent('ce@example.com, bob@example.com')));

    expect(params.onAddRecipient).toHaveBeenCalledWith('alice@example.com');
    expect(params.onAddRecipient).toHaveBeenCalledWith('bob@example.com');
  });

  test('When the pasted text is a single address, then it is left in the input for the browser to insert', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));
    const event = pasteEvent('alice@example.com');

    act(() => result.current.onPaste(event));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(params.onAddRecipient).not.toHaveBeenCalled();
  });

  test('When a pasted address is already a recipient, then it is not added again', () => {
    const params = createParams([{ id: '1', email: 'alice@example.com' }]);
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onPaste(pasteEvent('ALICE@example.com, bob@example.com')));

    expect(params.onAddRecipient).toHaveBeenCalledTimes(1);
    expect(params.onAddRecipient).toHaveBeenCalledWith('bob@example.com');
  });

  test('When the pasted list has entries that are not addresses, then they stay in the input to be fixed', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onPaste(pasteEvent('alice@example.com, not-an-email')));

    expect(params.onAddRecipient).toHaveBeenCalledExactlyOnceWith('alice@example.com');
    expect(result.current.inputValue).toBe('not-an-email');
  });

  test('When the typed address is confirmed with enter, then it is added', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('alice@example.com'));
    act(() => result.current.onKeyDown(keyEvent('Enter')));

    expect(params.onAddRecipient).toHaveBeenCalledExactlyOnceWith('alice@example.com');
    expect(result.current.inputValue).toBe('');
  });

  test('When the typed text is not an address, then it is kept in the input and no recipient is added', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('alice@'));
    act(() => result.current.onKeyDown(keyEvent('Enter')));

    expect(params.onAddRecipient).not.toHaveBeenCalled();
    expect(result.current.inputValue).toBe('alice@');
  });

  test('When the input loses focus with a valid address, then it is added', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('alice@example.com'));
    act(() => result.current.onBlur());

    expect(params.onAddRecipient).toHaveBeenCalledExactlyOnceWith('alice@example.com');
  });

  test('When backspace is pressed on an empty input, then the last recipient is removed', () => {
    const params = createParams([
      { id: '1', email: 'alice@example.com' },
      { id: '2', email: 'bob@example.com' },
    ]);
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onKeyDown(keyEvent('Backspace')));

    expect(params.onRemoveRecipient).toHaveBeenCalledExactlyOnceWith('2');
  });

  test('When the typed address is confirmed with a separator key, then it is added', () => {
    const params = createParams();
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('alice@example.com'));
    act(() => result.current.onKeyDown(keyEvent(';')));

    expect(params.onAddRecipient).toHaveBeenCalledExactlyOnceWith('alice@example.com');
  });

  test('When backspace is pressed while typing, then no recipient is removed', () => {
    const params = createParams([{ id: '1', email: 'alice@example.com' }]);
    const { result } = renderHook(() => useRecipientInput(params));

    act(() => result.current.onInputChange('bo'));
    act(() => result.current.onKeyDown(keyEvent('Backspace')));

    expect(params.onRemoveRecipient).not.toHaveBeenCalled();
  });
});
