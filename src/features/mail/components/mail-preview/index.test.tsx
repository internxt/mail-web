import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MailService } from '@/services/sdk/mail';
import { createTestStore } from '@/test-utils/createTestStore';
import { getMockedAttachment } from '@/test-utils/fixtures';
import PreviewMail from './index';
import type { EmailAttachment } from './preview';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@internxt/ui', () => ({
  Avatar: () => null,
  UserCheap: () => null,
}));

vi.mock('@/services/icons/icon.service', () => ({
  default: { getItemIcon: () => () => null },
}));

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { downloadAttachment: vi.fn(), getActiveDomains: vi.fn(async () => []) } },
}));

const downloadAttachment = vi.mocked(MailService.instance.downloadAttachment);

const LOGO = { ...getMockedAttachment(), name: 'logo.png', type: 'image/png', cid: 'logo@sender.com' };
const BANNER = { ...getMockedAttachment(), name: 'banner.gif', type: 'image/gif', cid: 'banner@sender.com' };
const INVOICE = { ...getMockedAttachment(), name: 'invoice.pdf', type: 'application/pdf', cid: null };

const objectUrlFor = (type: string) => `blob:${type}`;

const renderMail = (htmlBody: string, attachments: EmailAttachment[] = [LOGO]) =>
  render(
    <Provider store={createTestStore()}>
      <PreviewMail
        from={{ name: 'Sender', email: 'sender@gmail.com' }}
        to={[{ name: 'Me', email: 'me@inxt.me' }]}
        cc={[]}
        bcc={[]}
        mail={{
          id: 'mail-1',
          subject: 'Newsletter',
          receivedAt: '2026-10-01T10:00:00.000Z',
          htmlBody,
          attachments,
          envelope: null,
        }}
      />
    </Provider>,
  );

describe('Viewing an email with inline images', () => {
  beforeEach(() => {
    downloadAttachment.mockImplementation(async (_mailId, blobId) => ({
      data: new ArrayBuffer(8),
      contentType: [LOGO, BANNER, INVOICE].find((a) => a.blobId === blobId)!.type,
    }));
    URL.createObjectURL = vi.fn((blob: Blob) => objectUrlFor(blob.type));
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('When the body references an inline image, then the image is shown in place', async () => {
    renderMail('<p>Hello</p><img alt="Logo" src="cid:logo@sender.com">');

    await waitFor(() => expect(screen.getByAltText('Logo').getAttribute('src')).toBe(objectUrlFor('image/png')));
  });

  test('When the reference differs in casing, brackets or encoding from the image id, then the image is still shown', async () => {
    renderMail('<img alt="Logo" src="cid:%3CLOGO@Sender.com%3E">');

    await waitFor(() => expect(screen.getByAltText('Logo').getAttribute('src')).toBe(objectUrlFor('image/png')));
  });

  test('When an image is shown in the body, then it is not listed again as a downloadable attachment', async () => {
    renderMail('<img alt="Logo" src="cid:logo@sender.com">', [LOGO, INVOICE]);

    await waitFor(() => expect(screen.getByAltText('Logo').getAttribute('src')).toBe(objectUrlFor('image/png')));
    expect(screen.queryByText('logo.png')).toBeNull();
    expect(screen.getByText('invoice.pdf')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Download attachment' })).toHaveLength(1);
  });

  test('When an inline image is not referenced by the body, then the user gets it as a regular attachment', () => {
    renderMail('<p>No images here</p>', [LOGO]);

    expect(screen.getByText('logo.png')).toBeTruthy();
    expect(downloadAttachment).not.toHaveBeenCalled();
  });

  test('When an inline image cannot be downloaded, then the rest of the email and its other images are still shown', async () => {
    downloadAttachment.mockImplementation(async (_mailId, blobId) => {
      if (blobId === LOGO.blobId) throw new Error('Network error');
      return { data: new ArrayBuffer(8), contentType: BANNER.type };
    });

    renderMail(
      '<p>Monthly news</p><img alt="Logo" src="cid:logo@sender.com"><img alt="Banner" src="cid:banner@sender.com">',
      [LOGO, BANNER],
    );

    await waitFor(() => expect(screen.getByAltText('Banner').getAttribute('src')).toBe(objectUrlFor('image/gif')));
    expect(screen.getByText('Monthly news')).toBeTruthy();
    expect(screen.getByAltText('Logo').getAttribute('src')).toBe('cid:logo@sender.com');
  });

  test('When the images are embedded in the body itself, then they are shown without downloading anything', () => {
    const embedded = 'data:image/png;base64,iVBORw0KGgo=';

    renderMail(`<img alt="Pasted" src="${embedded}">`, []);

    expect(screen.getByAltText('Pasted').getAttribute('src')).toBe(embedded);
    expect(downloadAttachment).not.toHaveBeenCalled();
  });

  test('When the email is closed, then the memory held by its downloaded images is released', async () => {
    const { unmount } = renderMail('<img alt="Logo" src="cid:logo@sender.com">');
    await waitFor(() => expect(screen.getByAltText('Logo').getAttribute('src')).toBe(objectUrlFor('image/png')));

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(objectUrlFor('image/png'));
  });
});
