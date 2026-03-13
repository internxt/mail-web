/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AppError } from '@internxt/sdk';
import { AxiosError } from 'axios';
import { ErrorService } from './index';
import notificationsService, { ToastType } from '../notifications';

describe('Error service', () => {
  const service = ErrorService.instance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cast error to App Error', () => {
    test('When the error is an App Error, then return it directly', () => {
      const error = new AppError('already app error', 400);
      const result = service.castError(error);
      expect(result.message).toBe('already app error');
      expect(result.status).toBe(400);
    });

    test('When the error comes from axios, then return an App Error', () => {
      const axiosError = new AxiosError('request failed', '500', undefined, undefined, {
        status: 502,
        data: { message: 'Bad Gateway' },
        headers: { 'x-request-id': '123' },
        statusText: 'Bad Gateway',
        config: {} as any,
      });

      const result = service.castError(axiosError);

      expect(result.message).toBe('Bad Gateway');
      expect(result.status).toBe(502);
    });

    test('When the error is a string, then return an App Error', () => {
      const result = service.castError('something broke');
      expect(result.message).toBe('something broke');
    });

    test('When the error is an Error, then return an App Error', () => {
      const error = Object.assign(new Error('generic error'), { status: 503 });
      const result = service.castError(error);

      expect(result.message).toBe('generic error');
      expect(result.status).toBe(503);
    });

    test('When the error is an object, then return an App Error', () => {
      const result = service.castError({ message: 'obj error', status: 422 });

      expect(result.message).toBe('obj error');
      expect(result.status).toBe(422);
    });
  });

  describe('Notify user', () => {
    test('When notifying user, then show notification', () => {
      const message = 'something failed';
      const notificationSpy = vi.spyOn(notificationsService, 'show');

      service.notifyUser(message);

      expect(notificationSpy).toHaveBeenCalledWith(expect.objectContaining({ text: message, type: ToastType.Error }));
    });

    test('When notifying user with error type, then show notification with that type', () => {
      const message = 'Warning message';
      const notificationSpy = vi.spyOn(notificationsService, 'show');

      service.notifyUser(message, ToastType.Warning);

      expect(notificationSpy).toHaveBeenCalledWith(expect.objectContaining({ text: message, type: ToastType.Warning }));
    });
  });
});
