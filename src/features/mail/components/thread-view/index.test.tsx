import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { Provider } from 'react-redux';
import type { EmailAddress } from '@internxt/sdk/dist/mail/types';
import { createTestStore } from '@/test-utils/createTestStore';
import { getMockedMail } from '@/test-utils/fixtures';
import { ThreadView } from './index';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@internxt/ui', () => ({
  Avatar: ({ fullName }: { fullName: string }) => <div data-testid="avatar" data-name={fullName} />,
  UserCheap: () => null,
}));

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { getActiveDomains: vi.fn(async () => []) } },
}));

const renderThreadFrom = (from: EmailAddress) =>
  render(
    <Provider store={createTestStore()}>
      <ThreadView thread={[getMockedMail({ from: [from], htmlBody: '<p>Hello</p>', attachments: [] })]} />
    </Provider>,
  );

describe('Email details sender', () => {
  test('When the sender has a display name, then both the name and the address are visible', () => {
    renderThreadFrom({ name: 'Jane Doe', email: 'jane@gmail.com' });

    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('jane@gmail.com')).toBeTruthy();
  });

  test('When the sender has no display name, then the address takes its place', () => {
    renderThreadFrom({ email: 'jane@gmail.com' } as EmailAddress);

    expect(screen.getAllByText('jane@gmail.com')).toHaveLength(1);
    expect(screen.getByTestId('avatar').dataset.name).toBe('jane@gmail.com');
  });

  test('When the sender display name is blank, then the address takes its place', () => {
    renderThreadFrom({ name: '  ', email: 'jane@gmail.com' });

    expect(screen.getAllByText('jane@gmail.com')).toHaveLength(1);
    expect(screen.getByTestId('avatar').dataset.name).toBe('jane@gmail.com');
  });
});
