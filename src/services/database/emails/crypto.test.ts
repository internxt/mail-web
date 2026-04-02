import { describe, expect, test } from 'vitest';
import { CryptoEmail } from './crypto';

describe('Crypto for emails', () => {
  describe('Encrypt emails', () => {
    test('When passing subject and body,then it should be encrypted', async () => {
      const crypto = new CryptoEmail(new Uint8Array(32));
      const mail = { subject: 'Test subject', body: 'Test body' };
      const encryptedMail = await crypto.encrypt(mail);
      expect(encryptedMail.subject).not.toEqual(mail.subject);
      expect(encryptedMail.body).not.toEqual(mail.body);
    });

    test('When passing subject and body,then it should be decrypted', async () => {
      const crypto = new CryptoEmail(new Uint8Array(32));
      const mail = { subject: 'Test subject', body: 'Test body' };
      const encryptedMail = await crypto.encrypt(mail);
      const decryptedMail = await crypto.decrypt(encryptedMail);
      expect(decryptedMail.subject).toEqual(mail.subject);
      expect(decryptedMail.body).toEqual(mail.body);
    });
  });
});
