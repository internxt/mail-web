import { AppError } from '@internxt/sdk';
import { AxiosError } from 'axios';
import notificationsService, { ToastType } from '../notifications';

interface AxiosErrorResponse {
  error?: string;
  message?: string;
}

interface ErrorWithStatus extends Error {
  status?: number;
  headers?: Record<string, string>;
}

type ErrorTypeToast = ToastType.Warning | ToastType.Error;

export class ErrorService {
  public static readonly instance: ErrorService = new ErrorService();

  public castError(err: unknown): AppError {
    if (err instanceof AppError) return err;

    if (err instanceof AxiosError) {
      const { response } = err as AxiosError<AxiosErrorResponse>;
      return new AppError(
        response?.data?.error || response?.data?.message || err.message || 'Unknown error',
        response?.status,
        undefined,
        response?.headers as Record<string, string>,
      );
    }

    if (typeof err === 'string') return new AppError(err);

    if (err instanceof Error) {
      const { headers, status } = err as ErrorWithStatus;
      return new AppError(err.message || 'Unknown error', status, undefined, headers);
    }

    const map = err as Record<string, unknown>;
    return map.message ? new AppError(map.message as string, map.status as number) : new AppError('Unknown error');
  }

  public notifyUser(error: unknown, errorType?: ErrorTypeToast) {
    const { message, status, requestId } = this.castError(error);

    const isHandledError = status && status >= 400 && status < 500;
    const type = isHandledError ? ToastType.Warning : ToastType.Error;

    notificationsService.show({ text: message, type: errorType ?? type, requestId });
  }
}
