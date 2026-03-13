import { describe, test, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import notificationsService, { ToastType } from '.';

vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn(() => 'toast-id-123'),
    dismiss: vi.fn(),
  },
}));

describe('Notifications Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When showing a notification, then it should render the notification component', () => {
    const id = notificationsService.show({
      text: 'File uploaded',
      type: ToastType.Success,
    });

    expect(toast.custom).toHaveBeenCalledOnce();
    expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), { duration: 5000 });
    expect(id).toBe('toast-id-123');
  });

  test('When dismissing a notification, then it should remove the notification component', () => {
    const id = notificationsService.show({ text: 'Loading...' });

    notificationsService.dismiss(id);

    expect(toast.dismiss).toHaveBeenCalledOnce();
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id-123');
  });
});
