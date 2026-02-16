const MONTH_NAMES: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function isValidDateParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDateText(value: string): string | null {
  const input = value.trim();

  const iso = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (isValidDateParts(year, month, day)) {
      return toDateString(year, month, day);
    }
    return null;
  }

  const slash = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const year = Number(slash[3]);
    if (isValidDateParts(year, month, day)) {
      return toDateString(year, month, day);
    }
    return null;
  }

  const dashed = input.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashed) {
    const month = Number(dashed[1]);
    const day = Number(dashed[2]);
    const year = Number(dashed[3]);
    if (isValidDateParts(year, month, day)) {
      return toDateString(year, month, day);
    }
    return null;
  }

  const monthName = input.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthName) {
    const month = MONTH_NAMES[monthName[1].toLowerCase()];
    const day = Number(monthName[2]);
    const year = Number(monthName[3]);
    if (month && isValidDateParts(year, month, day)) {
      return toDateString(year, month, day);
    }
  }

  return null;
}

export function parseTimeText(value: string): string | null {
  const input = value.trim();

  const hhmm = input.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (hhmm) {
    const hour = Number(hhmm[1]);
    const minute = Number(hhmm[2]);
    return `${pad(hour)}:${pad(minute)}:00`;
  }

  const hhmmss = input.match(/^([01]?\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
  if (hhmmss) {
    const hour = Number(hhmmss[1]);
    const minute = Number(hhmmss[2]);
    const second = Number(hhmmss[3]);
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  const twelve = input.match(/^(\d{1,2})(?::([0-5]\d))?\s*([AaPp][Mm])$/);
  if (twelve) {
    const rawHour = Number(twelve[1]);
    const minute = Number(twelve[2] ?? "0");
    const period = twelve[3].toLowerCase();

    if (rawHour < 1 || rawHour > 12) {
      return null;
    }

    let hour = rawHour % 12;
    if (period === "pm") {
      hour += 12;
    }

    return `${pad(hour)}:${pad(minute)}:00`;
  }

  return null;
}

export function parseAppointment(dateText: string, timeText: string) {
  return {
    appointmentDate: parseDateText(dateText),
    appointmentTime: parseTimeText(timeText)
  };
}
