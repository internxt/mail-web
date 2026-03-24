import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import useComposeMessage from './useComposeMessage';
import type { DraftMessage } from '../types';

describe('Compose message - custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    test('When no draft is provided, then it should initialize with empty values', () => {
      const { result } = renderHook(() => useComposeMessage());

      expect(result.current.subjectValue).toBe('');
      expect(result.current.toRecipients).toEqual([]);
      expect(result.current.ccRecipients).toEqual([]);
      expect(result.current.bccRecipients).toEqual([]);
      expect(result.current.showCc).toBe(false);
      expect(result.current.showBcc).toBe(false);
    });

    test('When a draft is provided, then it should initialize with draft values', () => {
      const draft: DraftMessage = {
        subject: 'Test subject',
        to: [{ id: '1', email: 'to@test.com' }],
        cc: [{ id: '2', email: 'cc@test.com' }],
        bcc: [{ id: '3', email: 'bcc@test.com' }],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      expect(result.current.subjectValue).toBe('Test subject');
      expect(result.current.toRecipients).toEqual(draft.to);
      expect(result.current.ccRecipients).toEqual(draft.cc);
      expect(result.current.bccRecipients).toEqual(draft.bcc);
    });

    test('When draft has cc recipients, then should show cc', () => {
      const draft: DraftMessage = {
        cc: [{ id: '1', email: 'cc@test.com' }],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      expect(result.current.showCc).toBeTruthy();
    });

    test('When draft has bcc recipients, then should show bcc', () => {
      const draft: DraftMessage = {
        bcc: [{ id: '1', email: 'bcc@test.com' }],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      expect(result.current.showBcc).toBeTruthy();
    });
  });

  describe('Subject', () => {
    test('When subject changes, then the subject value should be updated as well', () => {
      const newSubject = 'New subject';
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onSubjectChange(newSubject));

      expect(result.current.subjectValue).toStrictEqual(newSubject);
    });
  });

  describe('Show Cc / Bcc', () => {
    test('When expanding cc, then it should be return true indicating so', () => {
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onShowCcRecipient());

      expect(result.current.showCc).toBeTruthy();
    });

    test('When expanding bcc, then it should be return true indicating so', () => {
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onShowBccRecipient());

      expect(result.current.showBcc).toBeTruthy();
    });
  });

  describe('To recipients', () => {
    test('When a recipient is added, then it should appear in recipients', () => {
      const email = 'user@test.com';
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onAddToRecipient(email));

      expect(result.current.toRecipients).toHaveLength(1);
      expect(result.current.toRecipients[0].email).toBe(email);
      expect(result.current.toRecipients[0].id).toBeDefined();
    });

    test('When a recipient is removed, then it should be gone from recipients', () => {
      const draft: DraftMessage = {
        to: [
          { id: 'id-1', email: 'a@test.com' },
          { id: 'id-2', email: 'b@test.com' },
        ],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      act(() => result.current.onRemoveToRecipient('id-1'));

      expect(result.current.toRecipients).toHaveLength(1);
      expect(result.current.toRecipients[0].id).toBe('id-2');
    });

    test('When multiple recipients are added, then all should be in recipient', () => {
      const { result } = renderHook(() => useComposeMessage());

      act(() => {
        result.current.onAddToRecipient('a@test.com');
        result.current.onAddToRecipient('b@test.com');
      });

      expect(result.current.toRecipients).toHaveLength(2);
    });
  });

  describe('Cc recipients', () => {
    test('When a cc recipient is added, then it should appear in recipient', () => {
      const email = 'cc@test.com';
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onAddCcRecipient(email));

      expect(result.current.ccRecipients).toHaveLength(1);
      expect(result.current.ccRecipients[0].email).toBe(email);
    });

    test('When a cc recipient is removed, then it should be gone from recipient', () => {
      const draft: DraftMessage = {
        cc: [
          { id: 'cc-1', email: 'cc1@test.com' },
          { id: 'cc-2', email: 'cc2@test.com' },
        ],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      act(() => result.current.onRemoveCcRecipient('cc-1'));

      expect(result.current.ccRecipients).toHaveLength(1);
      expect(result.current.ccRecipients[0].id).toBe('cc-2');
    });
  });

  describe('Bcc recipients', () => {
    test('When a bcc recipient is added, then it should appear in recipient', () => {
      const email = 'bcc@test.com';
      const { result } = renderHook(() => useComposeMessage());

      act(() => result.current.onAddBccRecipient(email));

      expect(result.current.bccRecipients).toHaveLength(1);
      expect(result.current.bccRecipients[0].email).toBe(email);
    });

    test('When a bcc recipient is removed, then it should be gone from recipients', () => {
      const draft: DraftMessage = {
        bcc: [
          { id: 'bcc-1', email: 'bcc1@test.com' },
          { id: 'bcc-2', email: 'bcc2@test.com' },
        ],
      };

      const { result } = renderHook(() => useComposeMessage(draft));

      act(() => result.current.onRemoveBccRecipient('bcc-1'));

      expect(result.current.bccRecipients).toHaveLength(1);
      expect(result.current.bccRecipients[0].id).toBe('bcc-2');
    });
  });
});
