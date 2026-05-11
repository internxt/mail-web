const MS_PER_DAY = 86_400_000;

export const getDaysUntil = (date: string | undefined): number | undefined =>
  date ? Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / MS_PER_DAY)) : undefined;
