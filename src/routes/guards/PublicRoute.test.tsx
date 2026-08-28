import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { createTestStore } from '@/test-utils/createTestStore';
import { useMailAccess, type MailAccessStatus } from '@/hooks/mail/useMailAccess';

vi.mock('@/hooks/mail/useMailAccess', () => ({ useMailAccess: vi.fn() }));

const mockedUseMailAccess = vi.mocked(useMailAccess);

const renderWelcome = ({ status, isAuthenticated }: { status: MailAccessStatus; isAuthenticated: boolean }) => {
  mockedUseMailAccess.mockReturnValue({ status });
  const store = createTestStore({ user: { isAuthenticated } });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/welcome" element={<p>welcome page</p>} />
          </Route>
          <Route path="/inbox" element={<p>inbox page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When the user is not authenticated, then it should render the welcome page', () => {
    renderWelcome({ status: 'loading', isAuthenticated: false });

    expect(screen.getByText('welcome page')).toBeTruthy();
  });

  test('When the plan does not include mail, then it should keep the user on the welcome page', () => {
    renderWelcome({ status: 'plan-required', isAuthenticated: true });

    expect(screen.getByText('welcome page')).toBeTruthy();
    expect(screen.queryByText('inbox page')).toBeNull();
  });

  test('When the account is ready, then it should send the user to the inbox', () => {
    renderWelcome({ status: 'ready', isAuthenticated: true });

    expect(screen.getByText('inbox page')).toBeTruthy();
  });

  test('When the account still has to be set up, then it should send the user into the app', () => {
    renderWelcome({ status: 'needs-setup', isAuthenticated: true });

    expect(screen.getByText('inbox page')).toBeTruthy();
  });

  test('When the access status is still loading, then it should render nothing', () => {
    const { container } = renderWelcome({ status: 'loading', isAuthenticated: true });

    expect(container.textContent).toBe('');
  });
});
