import { MailService } from '@/services/sdk/mail';
import { EmailSearchService } from '@/services/search';
import type { EmailListResponse, EmailResponse } from '@internxt/sdk';
import type { StoredEmail } from '../types';
import { EmailRepository } from './email.repository';

const BATCH_SIZE = 50;

export class EmailSync {
  static async run(): Promise<void> {
    const repository = EmailRepository.getInstance();
    const search = EmailSearchService.getInstance();

    let position = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const { emails, hasMoreMails } = await MailService.instance.getAllEmails({
          limit: BATCH_SIZE,
          position,
        });

        if (!emails.length) break;

        const storedEmails = emails.map((email) => EmailSync.toStoredEmail(email as EmailResponse));

        await repository.addMany(storedEmails);

        for (const email of storedEmails) {
          search.addToIndex(email);
        }

        position += BATCH_SIZE;
        hasMore = hasMoreMails;
      } catch (error) {
        console.error(`Sync failed at position ${position}:`, error);
        break;
      }
    }
  }

  private static toStoredEmail(mail: EmailListResponse['emails'][0]): StoredEmail {
    return {
      id: mail.id,
      params: {
        to: mail.to,
        from: mail.from,
        receivedAt: mail.receivedAt,
        isRead: mail.isRead,
        hasAttachment: mail.hasAttachment,
        folderId: mail.mailboxIds,
      },
      mail: {
        subject: mail.subject,
        body: mail.preview,
      },
    };
  }
}
