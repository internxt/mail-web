import { AppError } from '@internxt/sdk';
import { AxiosError } from 'axios';
import notificationsService, { ToastType } from '../notifications';

interface AxiosErrorResponse {
  error?: string;
  message?: string;
  code?: string;
}

interface ErrorWithStatus extends Error {
  status?: number;
  headers?: Record<string, string>;
  data?: AxiosErrorResponse;
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
        response?.data?.code,
        response?.headers as Record<string, string>,
      );
    }

    if (typeof err === 'string') return new AppError(err);

    if (err instanceof Error) {
      const { headers, status, data } = err as ErrorWithStatus;
      return new AppError(err.message || 'Unknown error', status, data?.code, headers);
    }

    const map = err as Record<string, unknown>;
    return map.message ? new AppError(map.message as string, map.status as number) : new AppError('Unknown error');
  }

  public notifyUser(error: unknown, errorType: ErrorTypeToast = ToastType.Error) {
    const { message, requestId } = this.castError(error);

    notificationsService.show({ text: message, type: errorType, requestId });
  }
}
