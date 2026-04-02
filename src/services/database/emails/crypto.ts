import { decryptEmailBody, encryptEmailBodyWithKey } from 'internxt-crypto';
import type { Email } from '../types';

export class CryptoEmail {
  private readonly key: Uint8Array;

  constructor(key: Uint8Array) {
    this.key = key;
  }

  async encrypt(mail: Email): Promise<Email> {
    const encryptedMail = await encryptEmailBodyWithKey(
      {
        subject: mail.subject,
        text: mail.body,
      },
      this.key,
    );

    return {
      subject: encryptedMail.encSubject,
      body: encryptedMail.encText,
    };
  }

  async decrypt(mail: Email): Promise<Email> {
    const decryptedMail = await decryptEmailBody(
      {
        encSubject: mail.subject,
        encText: mail.body,
      },
      this.key,
    );

    return {
      subject: decryptedMail.subject,
      body: decryptedMail.text,
    };
  }
}
