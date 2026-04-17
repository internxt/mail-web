import type {
  EmailDomainsResponse,
  EmailListResponse,
  EmailResponse,
  ListEmailsQuery,
  MailboxResponse,
  SearchFiltersQuery,
  UpdateEmailRequest,
} from '@internxt/sdk';
import { SdkManager } from '..';

export class MailService {
  public static readonly instance: MailService = new MailService();

  get client() {
    return SdkManager.instance.getMail();
  }

  /**
   * Gets a list of all active domains that the user has access to.
   *
   * @returns A promise that resolves with an `EmailDomainsResponse` object.
   */
  async getActiveDomains(): Promise<EmailDomainsResponse> {
    return this.client.getActiveDomains();
  }

  /**
   * Returns a list of all mailboxes and their properties.
   *
   * @returns A promise that resolves with an array of MailboxResponse objects.
   */
  async getMailboxesInfo(): Promise<MailboxResponse[]> {
    return this.client.getMailboxes();
  }

  /**
   * Returns a list of emails in the given folder.
   *
   * @param {ListEmailsQuery} query - The query parameters
   * @returns A promise that resolves with an EmailListResponse object
   */
  async listFolder(query?: ListEmailsQuery): Promise<EmailListResponse> {
    return this.client.listEmails(query);
  }

  /**
   * Returns a specific email by its ID.
   *
   * @param {string} emailId - The ID of the email to fetch
   * @returns A promise that resolves with an EmailResponse object
   */
  async getMessage(emailId: string): Promise<EmailResponse> {
    return this.client.getEmail(emailId);
  }

  /**
   * Updates the status of a specific email.
   * @param {string} emailId - The ID of the email to update
   * @param {UpdateEmailRequest} status - The new status of the email
   * @returns A promise that resolves when the update operation is complete
   */
  async updateEmailStatus(emailId: string, status: UpdateEmailRequest): Promise<void> {
    return this.client.updateEmail(emailId, status);
  }

  async search(query: SearchFiltersQuery): Promise<EmailListResponse> {
    return this.client.search(query);
  }
}
