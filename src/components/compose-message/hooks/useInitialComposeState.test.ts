import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useInitialComposeState } from './useInitialComposeState';
import { getMockedMail } from '@/test-utils/fixtures';
import { MailKeysService } from '@/services/mail-keys';
import type { ComposePayload } from '@/types/mail';

const translations: Record<string, string> = { 'mail.forward.prefix': 'Fwd:' };
vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => translations[key] ?? key }) }));

const SELF = 'me@inxt.me';

describe('Preparing the initial state of the compose dialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(MailKeysService.instance, 'getCurrentAddress').mockReturnValue(SELF);
  });

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
      replyTo: [],
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
      replyTo: [],
      to: [{ email: SELF }],
      cc: [{ email: 'cc1@inxt.me' }, { email: 'cc2@inxt.me' }],
    });
    const payload: ComposePayload = { mode: 'replyAll', sourceMail };

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

  test('When the dialog is opened with a persisted draft, then the compose hydrates with its subject, recipients, body and id', () => {
    const draft = getMockedMail({
      id: 'draft-77',
      subject: 'Draft in progress',
      to: [{ email: 'bob@inxt.me', name: 'Bob' }],
      cc: [{ email: 'carol@inxt.me' }],
      htmlBody: '<p>Half-written body</p>',
      attachments: [],
    });
    const draftPayload: ComposePayload = { mode: 'draft', draft };

    const { result } = renderHook(() => useInitialComposeState(draftPayload));

    expect(result.current.mode).toBe('draft');
    expect(result.current.data.draftId).toBe('draft-77');
    expect(result.current.data.subject).toBe('Draft in progress');
    expect(result.current.data.to).toHaveLength(1);
    expect(result.current.data.to[0]).toMatchObject({ email: 'bob@inxt.me', name: 'Bob' });
    expect(result.current.data.cc).toHaveLength(1);
    expect(result.current.data.cc[0]).toMatchObject({ email: 'carol@inxt.me' });
    expect(result.current.data.htmlBody).toBe('<p>Half-written body</p>');
    expect(result.current.data.persistedAttachments).toEqual([]);
  });

  test('When opening a draft without attachments, then persistedAttachments is an empty array', () => {
    const draft = getMockedMail({ id: 'draft-empty', attachments: [] });
    const draftPayload: ComposePayload = { mode: 'draft', draft };

    const { result } = renderHook(() => useInitialComposeState(draftPayload));

    expect(result.current.data.persistedAttachments).toEqual([]);
  });

  test('When opening a draft with attachments, then persistedAttachments mirrors the stored blob refs', () => {
    const draft = getMockedMail({
      id: 'draft-with-att',
      attachments: [
        { blobId: 'blob-1', name: 'one.pdf', size: 100, type: 'application/pdf' },
        { blobId: 'blob-2', name: 'two.png', size: 200, type: 'image/png' },
      ],
    });
    const draftPayload: ComposePayload = { mode: 'draft', draft };

    const { result } = renderHook(() => useInitialComposeState(draftPayload));

    expect(result.current.data.persistedAttachments).toEqual([
      { blobId: 'blob-1', name: 'one.pdf', size: 100, type: 'application/pdf' },
      { blobId: 'blob-2', name: 'two.png', size: 200, type: 'image/png' },
    ]);
  });

  test('When the dialog is opened in replyAll mode, then the recipients are derived and the reply-all flag is set', () => {
    const sourceMail = getMockedMail({
      from: [{ email: 'alice@inxt.me' }],
      replyTo: [],
      to: [{ email: SELF }, { email: 'bob@inxt.me' }],
      cc: [{ email: 'carol@inxt.me' }],
      subject: 'Project status',
    });
    const payload: ComposePayload = { mode: 'replyAll', sourceMail };

    const { result } = renderHook(() => useInitialComposeState(payload));

    expect(result.current.mode).toBe('replyAll');
    expect(result.current.data.replyAll).toBe(true);
    expect(result.current.data.to.map((r) => r.email)).toEqual(['alice@inxt.me']);
    expect(result.current.data.cc.map((r) => r.email)).toEqual(['bob@inxt.me', 'carol@inxt.me']);
  });
});
