import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { usePreviewMailActions } from './usePreviewMailActions';
import { ErrorService } from '@/services/error';

vi.mock('@/services/error', () => ({
  ErrorService: {
    instance: {
      castError: vi.fn((err) => err),
      notifyUser: vi.fn(),
    },
  },
}));

vi.mock('@/i18n', () => ({
  useTranslationContext: () => ({ translate: (key: string) => key }),
}));

const makeParams = (overrides?: Record<string, unknown>) => ({
  activeMailId: 'mail-1',
  folder: 'inbox' as const,
  clearActiveMail: vi.fn(),
  updateReadStatus: vi.fn().mockResolvedValue(null),
  moveToFolder: vi.fn().mockResolvedValue(null),
  deleteEmails: vi.fn().mockResolvedValue(null),
  ...overrides,
});

describe('Preview Mail Actions - custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mark as read', () => {
    test('When marking a mail as read, then the status update is sent with the correct mail and folder', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsRead());

      expect(params.updateReadStatus).toHaveBeenCalledWith({ emailId: 'mail-1', mailbox: 'inbox', isRead: true });
    });

    test('When marking a mail as read succeeds, then the preview stays open', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsRead());

      expect(params.clearActiveMail).not.toHaveBeenCalled();
    });

    test('When no mail is open and mark as read is triggered, then nothing happens', async () => {
      const params = makeParams({ activeMailId: undefined });
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsRead());

      expect(params.updateReadStatus).not.toHaveBeenCalled();
    });

    test('When marking a mail as read fails, then the error is logged', async () => {
      const error = new Error('Network error');
      const params = makeParams({ updateReadStatus: vi.fn().mockRejectedValue(error) });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsRead());

      expect(ErrorService.instance.castError).toHaveBeenCalledWith(error);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Mark as unread', () => {
    test('When marking a mail as unread, then the status update is sent with the correct mail and folder', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsUnread());

      expect(params.updateReadStatus).toHaveBeenCalledWith({ emailId: 'mail-1', mailbox: 'inbox', isRead: false });
    });

    test('When no mail is open and mark as unread is triggered, then nothing happens', async () => {
      const params = makeParams({ activeMailId: undefined });
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsUnread());

      expect(params.updateReadStatus).not.toHaveBeenCalled();
    });

    test('When marking a mail as unread fails, then the error is logged and the preview stays open', async () => {
      const error = new Error('Network error');
      const params = makeParams({ updateReadStatus: vi.fn().mockRejectedValue(error) });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMarkAsUnread());

      expect(ErrorService.instance.castError).toHaveBeenCalledWith(error);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(params.clearActiveMail).not.toHaveBeenCalled();
    });
  });

  describe('Trash', () => {
    test('When trashing a mail, then the deletion is sent with the correct mail and folder', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onTrash());

      expect(params.deleteEmails).toHaveBeenCalledWith({ emailIds: ['mail-1'], sourceMailbox: 'inbox' });
    });

    test('When trashing a mail succeeds, then the preview is closed', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onTrash());

      expect(params.clearActiveMail).toHaveBeenCalledOnce();
    });

    test('When no mail is open and trash is triggered, then nothing happens', async () => {
      const params = makeParams({ activeMailId: undefined });
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onTrash());

      expect(params.deleteEmails).not.toHaveBeenCalled();
    });

    test('When trashing a mail fails, then the error is logged and the preview stays open', async () => {
      const error = new Error('Server error');
      const params = makeParams({ deleteEmails: vi.fn().mockRejectedValue(error) });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onTrash());

      expect(ErrorService.instance.castError).toHaveBeenCalledWith(error);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(params.clearActiveMail).not.toHaveBeenCalled();
    });
  });

  describe('Move to folder', () => {
    test('When moving a mail to another folder, then the move is sent with the correct mail, source and destination', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMove('trash'));

      expect(params.moveToFolder).toHaveBeenCalledWith({
        emailIds: ['mail-1'],
        sourceMailbox: 'inbox',
        targetMailbox: 'trash',
      });
    });

    test('When moving a mail succeeds, then the preview is closed', async () => {
      const params = makeParams();
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMove('trash'));

      expect(params.clearActiveMail).toHaveBeenCalledOnce();
    });

    test('When no mail is open and move is triggered, then nothing happens', async () => {
      const params = makeParams({ activeMailId: undefined });
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMove('trash'));

      expect(params.moveToFolder).not.toHaveBeenCalled();
    });

    test('When moving a mail fails, then the error is logged and the preview stays open', async () => {
      const error = new Error('Server error');
      const params = makeParams({ moveToFolder: vi.fn().mockRejectedValue(error) });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePreviewMailActions(params));

      await act(() => result.current.onMove('trash'));

      expect(ErrorService.instance.castError).toHaveBeenCalledWith(error);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(params.clearActiveMail).not.toHaveBeenCalled();
    });
  });
});
