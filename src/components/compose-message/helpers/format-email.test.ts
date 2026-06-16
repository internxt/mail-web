import { describe, test, expect } from 'vitest';
import { formatEmailToReply } from './format-email';
import { getMockedMail } from '@/test-utils/fixtures';

describe('Formatting an email as a reply draft', () => {
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
