import dayjs from 'dayjs';

const MS_PER_DAY = 86_400_000;

export const getDaysUntil = (date: string | undefined): number | undefined => {
  if (!date) return undefined;
  const parsed = dayjs(date);
  if (!parsed.isValid()) return undefined;
  return Math.max(0, Math.ceil((parsed.valueOf() - Date.now()) / MS_PER_DAY));
};
