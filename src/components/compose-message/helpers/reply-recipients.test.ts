import { describe, test, expect } from 'vitest';
import { deriveReplyRecipients } from './reply-recipients';
import { getMockedMail } from '@/test-utils/fixtures';

const SELF = 'me@example.com';
const A = { email: 'alice@example.com' };
const B = { email: 'bob@example.com' };
const C = { email: 'carol@example.com' };

const sourceMail = (overrides: Partial<Parameters<typeof deriveReplyRecipients>[0]>) =>
  getMockedMail({ from: [A], replyTo: [], to: [{ email: SELF }], cc: [], ...overrides });

describe('Deriving reply recipients', () => {
  test('When replying, then the recipient is the original sender and there is no cc', () => {
    const result = deriveReplyRecipients(sourceMail({ from: [A], replyTo: [] }), SELF, false);

    expect(result).toEqual({ to: [A], cc: [] });
  });

  test('When the original has a Reply-To, then it wins over From for the recipient', () => {
    const result = deriveReplyRecipients(sourceMail({ from: [A], replyTo: [B] }), SELF, false);

    expect(result.to).toEqual([B]);
  });

  test('When replying to all, then the other participants are cc’d, excluding self and the recipient', () => {
    const result = deriveReplyRecipients(
      sourceMail({ from: [A], replyTo: [], to: [{ email: SELF }, B], cc: [C] }),
      SELF,
      true,
    );

    expect(result.to).toEqual([A]);
    expect(result.cc).toEqual([B, C]);
  });

  test('When not replying to all, then no participants are cc’d even if the original had many', () => {
    const result = deriveReplyRecipients(sourceMail({ from: [A], to: [{ email: SELF }, B], cc: [C] }), SELF, false);

    expect(result.cc).toEqual([]);
  });

  test('When the caller adds extra cc, then it is merged with the derived cc', () => {
    const extra = { email: 'extra@example.com' };
    const result = deriveReplyRecipients(sourceMail({ from: [A], to: [{ email: SELF }, B], cc: [] }), SELF, true, [
      extra,
    ]);

    expect(result.cc).toEqual([B, extra]);
  });

  test('When addresses repeat with different casing, then they are de-duplicated case-insensitively', () => {
    const result = deriveReplyRecipients(
      sourceMail({ from: [A], to: [{ email: 'BOB@example.com' }, B], cc: [B] }),
      SELF,
      true,
    );

    expect(result.cc).toEqual([{ email: 'BOB@example.com' }]);
  });

  test('When the original was sent by self, then self is never a recipient and to comes back empty', () => {
    const result = deriveReplyRecipients(sourceMail({ from: [{ email: SELF }], replyTo: [] }), SELF, false);

    expect(result.to).toEqual([]);
  });
});
