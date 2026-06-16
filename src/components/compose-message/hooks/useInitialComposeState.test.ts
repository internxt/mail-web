import { renderHook } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { useInitialComposeState } from './useInitialComposeState';
import { getMockedMail } from '@/test-utils/fixtures';
import type { ComposePayload } from '@/types/mail';

describe('Preparing the initial state of the compose dialog', () => {
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

  test('When the dialog is opened in a mode that is not yet implemented, then it falls back to an empty draft', () => {
    const sourceMail = getMockedMail();
    const replyAllPayload: ComposePayload = { mode: 'replyAll', sourceMail };
    const forwardPayload: ComposePayload = { mode: 'forward', sourceMail };
    const draftPayload: ComposePayload = { mode: 'draft', draft: sourceMail };

    const { result: replyAllResult } = renderHook(() => useInitialComposeState(replyAllPayload));
    const { result: forwardResult } = renderHook(() => useInitialComposeState(forwardPayload));
    const { result: draftResult } = renderHook(() => useInitialComposeState(draftPayload));

    expect(replyAllResult.current).toEqual({ mode: 'replyAll', data: { subject: '', to: [], cc: [], bcc: [] } });
    expect(forwardResult.current).toEqual({ mode: 'forward', data: { subject: '', to: [], cc: [], bcc: [] } });
    expect(draftResult.current).toEqual({ mode: 'draft', data: { subject: '', to: [], cc: [], bcc: [] } });
  });
});
