import { describe, test, expect, beforeEach, vi } from 'vitest';
import { formatEmailToForward, formatEmailToReply } from './format-email';
import { getMockedMail } from '@/test-utils/fixtures';

const translations: Record<string, string> = { 'mail.forward.prefix': 'Fwd:' };
const translate = ((key: string) => translations[key] ?? key) as unknown as Parameters<typeof formatEmailToForward>[1];

describe('Formatting an email as a reply draft', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When replying to a message, then the original sender becomes the only recipient of the draft', async () => {
    const original = getMockedMail({
      from: [{ name: 'Alice', email: 'alice@inxt.me' }],
      to: [{ name: 'Bob', email: 'bob@inxt.me' }],
    });

    const reply = formatEmailToReply(original);

    expect(reply.to).toEqual([{ name: 'Alice', email: 'alice@inxt.me' }]);
  });

  test('When replying to a message, then the subject is prefixed with "Re:" to mark the conversation', async () => {
    const original = getMockedMail({ subject: 'Project status' });

    const reply = formatEmailToReply(original);

    expect(reply.subject).toBe('Re: Project status');
  });

  test('When replying to a message whose subject already starts with "Re:", then the prefix is not duplicated', async () => {
    const original = getMockedMail({ subject: 'Re: Project status' });

    const reply = formatEmailToReply(original);

    expect(reply.subject).toBe('Re: Project status');
  });

  test('When replying, then the draft keeps the original conversation thread', async () => {
    const original = getMockedMail({ threadId: 'thread-42' });

    const reply = formatEmailToReply(original);

    expect(reply.threadId).toBe('thread-42');
  });

  test('When replying, then the original email id is preserved so the reply can be linked to its source', async () => {
    const original = getMockedMail({ id: 'mail-99' });

    const reply = formatEmailToReply(original);

    expect(reply.replyToEmailId).toBe('mail-99');
  });

  test('When replying, then the original cc and bcc fields are kept in the draft', async () => {
    const original = getMockedMail({
      cc: [{ email: 'cc@inxt.me' }],
      bcc: [{ email: 'bcc@inxt.me' }],
    });

    const reply = formatEmailToReply(original);

    expect(reply.cc).toEqual([{ email: 'cc@inxt.me' }]);
    expect(reply.bcc).toEqual([{ email: 'bcc@inxt.me' }]);
  });

  test('When the original message had no cc or bcc, then the draft has empty lists for those fields', async () => {
    const original = getMockedMail({ cc: undefined, bcc: undefined });

    const reply = formatEmailToReply(original);

    expect(reply.cc).toEqual([]);
    expect(reply.bcc).toEqual([]);
  });
});

describe('Formatting an email as a forward draft', () => {
  test('When forwarding a message, then the subject is prefixed with "Fwd:" to mark the forward', () => {
    const original = getMockedMail({ subject: 'Project status' });

    const forward = formatEmailToForward(original, translate);

    expect(forward.subject).toBe('Fwd: Project status');
  });

  test('When forwarding a message whose subject already starts with "Fwd:", then the prefix is not duplicated', () => {
    const original = getMockedMail({ subject: 'Fwd: Project status' });

    const forward = formatEmailToForward(original, translate);

    expect(forward.subject).toBe('Fwd: Project status');
  });

  test('When forwarding a message, then the user must choose the new recipients (the draft starts with empty fields)', () => {
    const original = getMockedMail({
      to: [{ email: 'bob@inxt.me' }],
      cc: [{ email: 'cc@inxt.me' }],
      bcc: [{ email: 'bcc@inxt.me' }],
    });

    const forward = formatEmailToForward(original, translate);

    expect(forward.to).toEqual([]);
    expect(forward.cc).toEqual([]);
    expect(forward.bcc).toEqual([]);
  });

  test('When forwarding, then the body shows who originally sent the message', () => {
    const original = getMockedMail({
      from: [{ name: 'Alice', email: 'alice@inxt.me' }],
    });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('Alice');
    expect(forward.htmlBody).toContain('alice@inxt.me');
  });

  test('When forwarding, then the body shows the original subject so the recipient knows what is being shared', () => {
    const original = getMockedMail({ subject: 'Project status' });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('Project status');
  });

  test('When forwarding, then the body shows the original recipients so the user can see the original audience', () => {
    const original = getMockedMail({
      to: [{ name: 'Bob', email: 'bob@inxt.me' }],
      cc: [{ name: 'Carol', email: 'carol@inxt.me' }],
    });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('bob@inxt.me');
    expect(forward.htmlBody).toContain('carol@inxt.me');
  });

  test('When the original message had no cc, then no cc line appears in the forwarded header', () => {
    const original = getMockedMail({ cc: [] });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).not.toContain('mail.forward.cc');
  });

  test('When the original message had a bcc, then it appears in the forwarded header so the user knows the full audience', () => {
    const original = getMockedMail({ bcc: [{ name: 'Secret', email: 'secret@inxt.me' }] });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('secret@inxt.me');
  });

  test('When forwarding, then email addresses appear as text (not as HTML tags) so they render correctly', () => {
    const original = getMockedMail({ from: [{ email: 'alice@inxt.me' }] });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('&lt;alice@inxt.me&gt;');
    expect(forward.htmlBody).not.toContain('<alice@inxt.me>');
  });

  test('When forwarding, then the original body is appended below the forwarded header', () => {
    const original = getMockedMail({ htmlBody: '<p>original content</p>' });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('<p>original content</p>');
  });

  test('When the original message has no html version, then the plain text body is appended instead', () => {
    const original = getMockedMail({ htmlBody: null as unknown as string, textBody: 'plain content' });

    const forward = formatEmailToForward(original, translate);

    expect(forward.htmlBody).toContain('plain content');
  });
});
