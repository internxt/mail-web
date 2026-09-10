import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PreviewHeader, { type User } from './index';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@internxt/ui', () => ({
  Avatar: ({ fullName, src }: { fullName: string; src?: string }) => (
    <div data-testid="avatar" data-name={fullName} data-src={src ?? ''} />
  ),
  UserCheap: ({ fullName, email }: { fullName: string; email: string }) => (
    <div data-testid="user-card">
      {fullName} | {email}
    </div>
  ),
}));

const sender: User = { name: 'Jane Doe', email: 'jane@inxt.me', avatar: 'https://inxt.me/jane.png' };
const recipient: User = { name: 'Bob Smith', email: 'bob@inxt.me' };

const renderHeader = (props: Partial<React.ComponentProps<typeof PreviewHeader>> = {}) =>
  render(
    <PreviewHeader sender={sender} date="2024-04-10T11:32:00.000Z" to={[recipient]} cc={[]} bcc={[]} {...props} />,
  );

describe('PreviewHeader', () => {
  test('When the sender name is hovered, then the card should show the sender name and address', () => {
    renderHeader();

    fireEvent.mouseEnter(screen.getByText('Jane Doe').parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('Jane Doe | jane@inxt.me');
  });

  test('When the sender avatar is hovered, then the card should show the sender name and address', () => {
    renderHeader();

    fireEvent.mouseEnter(screen.getByTestId('avatar').parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('Jane Doe | jane@inxt.me');
  });

  test('When the sender is not hovered, then no card should be rendered', () => {
    renderHeader();

    expect(screen.queryByTestId('user-card')).toBeNull();
  });

  test('When a recipient chip is hovered, then the card should show that recipient and not the sender', () => {
    renderHeader();

    fireEvent.mouseEnter(screen.getByText('Bob').parentElement!.parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('Bob Smith | bob@inxt.me');
  });

  test('When the sender has no avatar, then the card should still show the address on hover', () => {
    renderHeader({ sender: { name: 'Jane Doe', email: 'jane@inxt.me' } });

    fireEvent.mouseEnter(screen.getByText('Jane Doe').parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('Jane Doe | jane@inxt.me');
  });

  test('When a collapsed snippet is given, then it should replace the recipient lines', () => {
    renderHeader({ collapsedSnippet: <span data-testid="snippet">Hello there</span> });

    expect(screen.getByTestId('snippet')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });
});
