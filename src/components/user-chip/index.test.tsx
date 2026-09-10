import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import UserChip from './index';

vi.mock('@internxt/ui', () => ({
  UserCheap: ({ fullName, email }: { fullName: string; email: string }) => (
    <div data-testid="user-card">
      {fullName} | {email}
    </div>
  ),
}));

const getChip = () => screen.getByText(/jane|doe/i).parentElement!.parentElement!;

describe('UserChip', () => {
  test('When the user has a full name, then only the first name should be shown', () => {
    render(<UserChip name="Jane Doe" email="jane@inxt.me" />);

    expect(screen.getByText('Jane')).toBeTruthy();
    expect(screen.queryByText('Jane Doe')).toBeNull();
  });

  test('When the user has no name, then the email local part should be shown', () => {
    render(<UserChip name="  " email="jane@inxt.me" />);

    expect(screen.getByText('jane')).toBeTruthy();
  });

  test('When the chip is hovered, then the card should show the full name and the email', () => {
    render(<UserChip name="Jane Doe" email="jane@inxt.me" />);

    fireEvent.mouseEnter(getChip());

    expect(screen.getByTestId('user-card').textContent).toBe('Jane Doe | jane@inxt.me');
  });

  test('When the chip is removable, then the remove icon should only be visible while hovering', () => {
    const { container } = render(<UserChip name="Jane Doe" email="jane@inxt.me" onRemove={vi.fn()} />);
    const removeIcon = container.querySelector('svg')!;

    expect(removeIcon.getAttribute('class')).toContain('opacity-0');

    fireEvent.mouseEnter(getChip());
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('opacity-100');
  });

  test('When the chip is not removable, then no remove icon should be rendered', () => {
    const { container } = render(<UserChip name="Jane Doe" email="jane@inxt.me" />);

    expect(container.querySelector('svg')).toBeNull();
  });

  test('When the remove icon is clicked, then onRemove should be called without bubbling the click up', () => {
    const onRemove = vi.fn();
    const onParentClick = vi.fn();
    const { container } = render(
      <button type="button" onClick={onParentClick}>
        <UserChip name="Jane Doe" email="jane@inxt.me" onRemove={onRemove} />
      </button>,
    );

    fireEvent.click(container.querySelector('svg')!);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
