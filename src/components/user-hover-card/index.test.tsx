import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import UserHoverCard from './index';

vi.mock('@internxt/ui', () => ({
  UserCheap: ({ fullName, email, avatar }: { fullName: string; email: string; avatar?: string }) => (
    <div data-testid="user-card" data-avatar={avatar ?? ''}>
      {fullName} | {email}
    </div>
  ),
}));

const renderHoverCard = (props: Partial<React.ComponentProps<typeof UserHoverCard>> = {}) =>
  render(
    <UserHoverCard name="Jane Doe" email="jane@inxt.me" {...props}>
      {props.children ?? <span data-testid="trigger">Jane Doe</span>}
    </UserHoverCard>,
  );

const VIEWPORT = { width: 1024, height: 768 };

interface TriggerRect {
  left: number;
  top: number;
  bottom: number;
}

interface CardRect {
  width: number;
  height: number;
}

const stubRects = ({ trigger, card }: { trigger: TriggerRect; card: CardRect }) => {
  Object.defineProperty(window, 'innerWidth', { value: VIEWPORT.width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: VIEWPORT.height, configurable: true });

  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const isCard = this.getAttribute('role') === 'tooltip';
    const { left, top, bottom } = isCard ? { left: 0, top: 0, bottom: 0 } : trigger;
    const { width, height } = isCard ? card : { width: 0, height: 0 };
    return { left, top, bottom, width, height, right: left + width, x: left, y: top } as DOMRect;
  });
};

afterEach(() => vi.restoreAllMocks());

describe('UserHoverCard', () => {
  test('When the trigger is not hovered, then no card should be rendered', () => {
    renderHoverCard();

    expect(screen.queryByTestId('user-card')).toBeNull();
  });

  test('When the trigger is hovered, then the card should show the full name and the email', () => {
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('Jane Doe | jane@inxt.me');
  });

  test('When the card is shown, then it should be rendered outside of the trigger tree', () => {
    const { container } = renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(container.querySelector('[data-testid="user-card"]')).toBeNull();
    expect(document.body.contains(screen.getByTestId('user-card'))).toBe(true);
  });

  test('When the pointer leaves the trigger, then the card should be removed', () => {
    renderHoverCard();
    const trigger = screen.getByTestId('trigger').parentElement!;

    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);

    expect(screen.queryByTestId('user-card')).toBeNull();
  });

  test('When the user has no name, then the card should fall back to the email', () => {
    renderHoverCard({ name: '   ' });

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByTestId('user-card').textContent).toBe('jane@inxt.me | jane@inxt.me');
  });

  test('When an avatar is given, then it should be forwarded to the card', () => {
    renderHoverCard({ avatar: 'https://inxt.me/jane.png' });

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByTestId('user-card').getAttribute('data-avatar')).toBe('https://inxt.me/jane.png');
  });

  test('When children are a render function, then they should receive the hovered state', () => {
    renderHoverCard({
      children: (isHovered: boolean) => <span data-testid="trigger">{isHovered ? 'hovered' : 'idle'}</span>,
    });
    const trigger = screen.getByTestId('trigger');

    expect(trigger.textContent).toBe('idle');

    fireEvent.mouseEnter(trigger.parentElement!);
    expect(screen.getByTestId('trigger').textContent).toBe('hovered');

    fireEvent.mouseLeave(screen.getByTestId('trigger').parentElement!);
    expect(screen.getByTestId('trigger').textContent).toBe('idle');
  });

  test('When the card is shown, then the trigger should describe it for assistive technologies', () => {
    renderHoverCard();
    const trigger = screen.getByTestId('trigger').parentElement!;

    expect(trigger.getAttribute('aria-describedby')).toBeNull();

    fireEvent.mouseEnter(trigger);

    const cardWrapper = screen.getByRole('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe(cardWrapper.id);
  });

  test('When the card is shown, then its lines should be allowed to grow and wrap instead of being truncated', () => {
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    const cardWrapper = screen.getByRole('tooltip');
    expect(cardWrapper.className).toContain('[&>div]:max-w-96');
    expect(cardWrapper.className).toContain('[&_p]:whitespace-normal');
    expect(cardWrapper.className).toContain('[&_p]:break-words');
  });

  test('When there is room for the card, then it should sit right below the trigger', () => {
    stubRects({ trigger: { left: 100, top: 100, bottom: 120 }, card: { width: 200, height: 100 } });
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    const cardWrapper = screen.getByRole('tooltip');
    expect(cardWrapper.style.left).toBe('100px');
    expect(cardWrapper.style.top).toBe('124px');
  });

  test('When the card would overflow the right edge, then it should be shifted back into the viewport', () => {
    stubRects({ trigger: { left: 900, top: 100, bottom: 120 }, card: { width: 384, height: 100 } });
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByRole('tooltip').style.left).toBe('632px');
  });

  test('When the card does not fit below the trigger, then it should be flipped above it', () => {
    stubRects({ trigger: { left: 100, top: 700, bottom: 720 }, card: { width: 200, height: 120 } });
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByRole('tooltip').style.top).toBe('576px');
  });

  test('When the card fits on neither side, then it should stay within the top of the viewport', () => {
    stubRects({ trigger: { left: 100, top: 10, bottom: 30 }, card: { width: 200, height: 740 } });
    renderHoverCard();

    fireEvent.mouseEnter(screen.getByTestId('trigger').parentElement!);

    expect(screen.getByRole('tooltip').style.top).toBe('8px');
  });
});
