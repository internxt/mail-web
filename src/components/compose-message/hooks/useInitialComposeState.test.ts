import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useInitialComposeState } from './useInitialComposeState';
import { getMockedMail } from '@/test-utils/fixtures';
import type { ComposePayload } from '@/types/mail';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

describe('Preparing the initial state of the compose dialog', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('When the dialog opens without any payload, then the compose starts as a blank new message', () => {
    const { result } = renderHook(() => useInitialComposeState(undefined));

    expect(result.current.mode).toBe('new');
    expect(result.current.data).toEqual({ subject: '', to: [], cc: [], bcc: [] });
  });

  test('When the user starts a new message, then the compose opens empty', () => {
    const payload: ComposePayload = { mode: 'new' };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.mode).toBe('new');
    expect(result.current.data).toEqual({ subject: '', to: [], cc: [], bcc: [] });
  });

  test('When the user replies to a message, then the sender of the original mail is pre-filled as the only recipient', () => {
    const sourceMail = getMockedMail({
      from: [{ name: 'Alice', email: 'alice@inxt.me' }],
      to: [{ email: 'bob@inxt.me' }],
      subject: 'Project status',
    });
    const payload: ComposePayload = { mode: 'reply', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.mode).toBe('reply');
    expect(result.current.data.to).toHaveLength(1);
    expect(result.current.data.to[0]).toMatchObject({ email: 'alice@inxt.me', name: 'Alice' });
  });

  test('When the user replies to a message, then the subject is pre-filled as a reply of the original conversation', () => {
    const sourceMail = getMockedMail({ subject: 'Project status' });
    const payload: ComposePayload = { mode: 'reply', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.subject).toBe('Re: Project status');
  });

  test('When the user replies to a message, then the original email is remembered so the reply can be linked back to it', () => {
    const sourceMail = getMockedMail({ id: 'mail-99' });
    const payload: ComposePayload = { mode: 'reply', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.replyToEmailId).toBe('mail-99');
  });

  test('When the user replies to a message, then every recipient in the draft has a unique local identifier', () => {
    const sourceMail = getMockedMail({
      from: [{ email: 'alice@inxt.me' }],
      cc: [{ email: 'cc1@inxt.me' }, { email: 'cc2@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'reply', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    const allIds = [...result.current.data.to, ...result.current.data.cc, ...result.current.data.bcc].map((r) => r.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    allIds.forEach((id) => expect(id).toBeTruthy());
  });

  test('When the user forwards a message, then the subject is pre-filled as a forward of the original conversation', () => {
    const sourceMail = getMockedMail({ subject: 'Project status' });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.mode).toBe('forward');
    expect(result.current.data.subject).toBe('Fwd: Project status');
  });

  test('When the user forwards a message, then the recipient fields start empty so the user chooses who receives it', () => {
    const sourceMail = getMockedMail({
      to: [{ email: 'bob@inxt.me' }],
      cc: [{ email: 'cc@inxt.me' }],
      bcc: [{ email: 'bcc@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.to).toEqual([]);
    expect(result.current.data.cc).toEqual([]);
    expect(result.current.data.bcc).toEqual([]);
  });

  test('When the user forwards a message, then the body includes the original sender info so the user knows what is being shared', () => {
    const sourceMail = getMockedMail({
      from: [{ name: 'Alice', email: 'alice@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.htmlBody).toContain('alice@inxt.me');
  });

  test('When the user forwards a message, then the subject is pre-filled as a forward of the original conversation', () => {
    const sourceMail = getMockedMail({ subject: 'Project status' });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.mode).toBe('forward');
    expect(result.current.data.subject).toBe('Fwd: Project status');
  });

  test('When the user forwards a message, then the recipient fields start empty so the user chooses who receives it', () => {
    const sourceMail = getMockedMail({
      to: [{ email: 'bob@inxt.me' }],
      cc: [{ email: 'cc@inxt.me' }],
      bcc: [{ email: 'bcc@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.to).toEqual([]);
    expect(result.current.data.cc).toEqual([]);
    expect(result.current.data.bcc).toEqual([]);
  });

  test('When the user forwards a message, then the body includes the original sender info so the user knows what is being shared', () => {
    const sourceMail = getMockedMail({
      from: [{ name: 'Alice', email: 'alice@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'forward', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.data.htmlBody).toContain('alice@inxt.me');
  });

  test('When the dialog is opened in replyAll or draft mode, then it falls back to an empty draft', () => {
    const sourceMail = getMockedMail();
    const draftPayload: ComposePayload = { mode: 'draft', draft: sourceMail };

    const { result } = renderHook(() => useInitialComposeState(draftPayload));

    expect(result.current).toEqual({ mode: 'draft', data: { subject: '', to: [], cc: [], bcc: [] } });
  });
});
