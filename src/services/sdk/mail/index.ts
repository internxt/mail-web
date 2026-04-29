import type {
  EmailDomainsResponse,
  EmailListResponse,
  EmailResponse,
  ListEmailsQuery,
  MailAccountKeysResponse,
  MailboxResponse,
  SearchFiltersQuery,
  SetupMailAccountPayload,
  UpdateEmailRequest,
} from '@internxt/sdk';
import { SdkManager } from '..';

export class MailService {
  public static readonly instance: MailService = new MailService();

  get client() {
    return SdkManager.instance.getMail();
  }

  /**
   * Creates a mail account for the user.
   *
   * @param payload - Setup details for the mail account.
   * @returns A promise that resolves with the created account address.
   */
  async setupMailAccount(payload: SetupMailAccountPayload): Promise<{ address: string }> {
    return this.client.setupMailAccount(payload);
  }

  /**
   * Gets the mail account keys for the given address.
   *
   * @param address - The mail address whose keys should be retrieved.
   * @returns A promise that resolves with the encrypted keys for the address.
   */
  async getMailAccountKeys(address: string): Promise<MailAccountKeysResponse> {
    return this.client.getMailAccountKeys(address);
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

  /**
   * Return the list of emails matching the search filters
   * @param query - The search filters
   * @returns the emails list
   */
  async search(query: SearchFiltersQuery): Promise<EmailListResponse> {
    return this.client.search(query);
  }

  /**
   * Deletes an email. Behavior depends on the source folder: emails in inbox/spam are moved to trash; emails already in trash are permanently deleted.
   * @param emailId - The ID of the email we want to trash or delete
   * @returns - A promise that resolves when the operation is complete
   */
  async trashEmail(emailId: string): Promise<void> {
    return this.client.deleteEmail(emailId);
  }
}
