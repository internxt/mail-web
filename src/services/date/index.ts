import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

type DateInput = string | Date | dayjs.Dayjs;

export class DateService {
  public static setLocale(locale: string): void {
    dayjs.locale(locale);
  }

  /** "April 10, 2024" */
  public static format(date: DateInput, template = 'LL'): string {
    return dayjs(date).format(template);
  }

  /** "April 10, 2024, 11:32 AM" */
  public static formatWithTime(date: DateInput): string {
    return dayjs(date).format('LL, h:mm A');
  }

  /**
   * Smart timestamp for mail tray:
   * - Same day → "20:35"
   * - Same year → "Apr 10, 15:48"
   * - Different year → "Apr 10, 2025, 15:48"
   */
  public static formatMailTimestamp(date: DateInput): string {
    const d = dayjs(date);
    const now = dayjs();

    if (d.isSame(now, 'day')) {
      return d.format('HH:mm');
    }

    if (d.isSame(now, 'year')) {
      return d.format('MMM D, HH:mm');
    }

    return d.format('MMM D, YYYY, HH:mm');
  }

  /** "2 hours ago", "in 3 days" */
  public static fromNow(date: DateInput): string {
    return dayjs(date).fromNow();
  }

  /** "2 hours ago" / "2 hours later" relative to another date */
  public static from(date: DateInput, referenceDate: DateInput): string {
    return dayjs(date).from(referenceDate);
  }
}
