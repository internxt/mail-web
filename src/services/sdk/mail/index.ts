import type {
  DownloadAttachmentResponse,
  DraftEmailRequest,
  EmailCreatedResponse,
  EmailDomainsResponse,
  EmailListResponse,
  EmailResponse,
  ListEmailsQuery,
  LookupRecipientKeysResponse,
  MailAccountKeysResponse,
  MailAccountResponse,
  MailboxResponse,
  SearchFiltersQuery,
  SendEmailRequest,
  SetupMailAccountPayload,
  UpdateEmailRequest,
  UploadAttachmentResponse,
} from '@internxt/sdk/dist/mail/types';
import { SdkManager } from '..';
import type { RequestCanceler } from '@internxt/sdk/dist/shared/http/types';

export type MailMeResponse = MailAccountResponse;

export class MailService {
  public static readonly instance: MailService = new MailService();

  get client() {
    return SdkManager.instance.getMail();
  }

  /**
   * Returns the current mail account for the logged in user.
   * When the account has been suspended due to a plan downgrade, `state` is
   * `suspended` and `deletionAt` holds the scheduled UTC deletion timestamp.
   */
  async getMe(): Promise<MailMeResponse> {
    return this.client.getMailAccount();
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
   * Gets the mail account keys. When `address` is omitted the backend returns
   * the keys for the caller's default address.
   *
   * @param address - Optional. The mail address whose keys should be retrieved.
   * @returns A promise that resolves with the encrypted keys for the address.
   */
  async getMailAccountKeys(address?: string): Promise<MailAccountKeysResponse> {
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
  async getThreads(emailId: string): Promise<EmailResponse[]> {
    return this.client.getThreads(emailId);
  }

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

  /**
   * Sends an email. The recipient/encryption decision is made by the caller —
   * pass `encryption` for an end-to-end-encrypted send, omit it for cleartext.
   *
   * @param payload - The send request (recipients, subject, body, optional encryption block)
   * @returns The id of the created email
   */
  async sendEmail(payload: SendEmailRequest): Promise<EmailCreatedResponse> {
    return this.client.sendEmail(payload);
  }

  /**
   * Drafts an email. Should be encrypted with the sender keys only
   *
   * @param payload - The draft request (recipients, subject, body, optional encryption block, attachments)
   * @returns The id of the drafted email
   */
  async draftEmail(payload: DraftEmailRequest): Promise<EmailResponse> {
    return this.client.saveDraft(payload);
  }

  /**
   * Updates an existing draft
   *
   * @param draftId - The id of the draft to update
   * @param payload - The draft request (recipients, subject, body, optional encryption block, attachments)
   * @returns A promise that resolves when the update operation is complete
   */
  async updateDraft(draftId: string, payload: DraftEmailRequest): Promise<EmailResponse> {
    return this.client.updateDraft(draftId, payload);
  }

  /**
   * Returns a specific draft by its ID.
   *
   * @param {string} draftId - The ID of the draft to fetch
   * @returns A promise that resolves with an EmailResponse object
   */
  async getDraft(draftId: string): Promise<EmailResponse> {
    return this.client.getDraft(draftId);
  }

  /**
   * Discards an existing draft
   * @param draftId - The ID of the drad
   * @returns
   */
  async discardDraft(draftId: string): Promise<void> {
    return this.client.discardDraft(draftId);
  }

  /**
   * Looks up the public encryption keys for a batch of recipient addresses.
   * Returns `publicKey: null` for external or unknown addresses, which the
   * caller should treat as a signal to fall back to cleartext.
   *
   * @param addresses - 1-50 email addresses
   * @returns A list of `{ address, publicKey | null }`
   */
  async lookupRecipientKeys(addresses: string[]): Promise<LookupRecipientKeysResponse> {
    return this.client.lookupRecipientKeys(addresses);
  }

  /**
   * Uploading an attachment to the S3
   * @param file - The attachment we want to upload
   * @returns an object containing the promise and the request canceler
   */
  uploadAttachment(file: File): {
    promise: Promise<UploadAttachmentResponse>;
    requestCanceler: RequestCanceler;
  } {
    return this.client.uploadAttachment(file);
  }

  /**
   * Download an attachment from a given mail
   * @param mailId - The ID of the mail the attachment is attached to
   * @param blobId - The ID of the attachment
   * @param mailName - The name of the attachment
   * @param mailType - The type of the attachment
   * @returns A readable stream of the attachment
   */
  async downloadAttachment(
    mailId: string,
    blobId: string,
    mailName: string,
    mailType: string,
  ): Promise<DownloadAttachmentResponse> {
    return this.client.downloadAttachment(mailId, blobId, {
      name: mailName,
      type: mailType,
    });
  }
}
