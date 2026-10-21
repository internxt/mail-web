import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MailService } from '@/services/sdk/mail';
import { createTestStore } from '@/test-utils/createTestStore';
import { getMockedUser } from '@/test-utils/fixtures';
import { SenderField } from './SenderField';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { getMailAccountKeys: vi.fn() } },
}));

const getMailAccountKeys = vi.mocked(MailService.instance.getMailAccountKeys);

const mailAccountWithAddress = (address: string) =>
  getMailAccountKeys.mockResolvedValue({
    address,
    publicKey: 'pub',
    encryptionPrivateKey: 'enc',
    recoveryPrivateKey: 'rec',
  } as Awaited<ReturnType<typeof MailService.instance.getMailAccountKeys>>);

const renderSenderOf = (name: string, lastname: string) =>
  render(
    <Provider store={createTestStore({ user: { user: getMockedUser({ name, lastname }) } })}>
      <SenderField />
    </Provider>,
  );

describe('Compose sender', () => {
  beforeEach(() => {
    getMailAccountKeys.mockReset();
  });

  test('When composing an email, then the sender shows the account name and the address it is sent from', async () => {
    mailAccountWithAddress('jane@inxt.me');

    renderSenderOf('Jane', 'Doe');

    expect((await screen.findByTestId('compose-sender')).textContent).toBe('Jane Doe <jane@inxt.me>');
  });

  test('When the account has no name, then the sender shows only the address', async () => {
    mailAccountWithAddress('jane@inxt.me');

    renderSenderOf('', '');

    expect((await screen.findByTestId('compose-sender')).textContent).toBe('jane@inxt.me');
  });

  test('When the mail address is not available yet, then no sender is shown', () => {
    getMailAccountKeys.mockReturnValue(new Promise(() => {}));

    renderSenderOf('Jane', 'Doe');

    expect(screen.queryByTestId('compose-sender')).toBeNull();
  });
});
