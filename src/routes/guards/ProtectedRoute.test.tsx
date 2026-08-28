import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { createTestStore } from '@/test-utils/createTestStore';
import { useMailAccess, type MailAccessStatus } from '@/hooks/mail/useMailAccess';

vi.mock('@/hooks/mail/useMailAccess', () => ({ useMailAccess: vi.fn() }));

const mockedUseMailAccess = vi.mocked(useMailAccess);

const renderAt = ({
  status,
  path,
  isAuthenticated = true,
}: {
  status: MailAccessStatus;
  path: string;
  isAuthenticated?: boolean;
}) => {
  mockedUseMailAccess.mockReturnValue({ status });
  const store = createTestStore({ user: { isAuthenticated } });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/welcome" element={<p>welcome page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/inbox" element={<p>inbox page</p>} />
            <Route path="/identity-setup" element={<p>identity setup page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When the user is not authenticated, then it should send them to the welcome page', () => {
    renderAt({ status: 'loading', path: '/inbox', isAuthenticated: false });

    expect(screen.getByText('welcome page')).toBeTruthy();
  });

  test('When the plan does not include mail, then it should send them to the welcome page instead of the setup flow', () => {
    renderAt({ status: 'plan-required', path: '/inbox' });

    expect(screen.getByText('welcome page')).toBeTruthy();
    expect(screen.queryByText('identity setup page')).toBeNull();
  });

  test('When the plan does not include mail, then it should not let them open the setup flow directly', () => {
    renderAt({ status: 'plan-required', path: '/identity-setup' });

    expect(screen.getByText('welcome page')).toBeTruthy();
    expect(screen.queryByText('identity setup page')).toBeNull();
  });

  test('When the account still has to be set up, then it should send them to the setup flow', () => {
    renderAt({ status: 'needs-setup', path: '/inbox' });

    expect(screen.getByText('identity setup page')).toBeTruthy();
  });

  test('When the account is ready, then it should render the requested view', () => {
    renderAt({ status: 'ready', path: '/inbox' });

    expect(screen.getByText('inbox page')).toBeTruthy();
  });

  test('When the account is ready and they are on the setup flow, then it should send them to the inbox', () => {
    renderAt({ status: 'ready', path: '/identity-setup' });

    expect(screen.getByText('inbox page')).toBeTruthy();
  });

  test('When the access status is still loading, then it should render nothing', () => {
    const { container } = renderAt({ status: 'loading', path: '/inbox' });

    expect(container.textContent).toBe('');
  });
});
