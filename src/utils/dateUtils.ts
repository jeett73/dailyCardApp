export const TIMEZONE = 'Asia/Kolkata';

export const getKolkataCurrentDate = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

  const year = getPart('year');
  const month = getPart('month') - 1; // 0-indexed for consistency with Date.getMonth()
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return { year, month, day, hour, minute, second };
};

export const formatToKolkataDateString = (timestamp: number | string | Date): string => {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    // en-CA is YYYY-MM-DD
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

export const getKolkataDateObject = (
  timestamp: number | string | Date,
): { year: number; month: number; day: number } => {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

  return {
    year: getPart('year'),
    month: getPart('month') - 1, // 0-indexed
    day: getPart('day'),
  };
};

export const formatToKolkataTime = (timestamp: number | string | Date): string => {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return formatter.format(date);
};
