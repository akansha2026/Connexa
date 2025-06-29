import { clsx, type ClassValue } from "clsx"
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(dateTime: Date | undefined): string {
  if (!dateTime) return "";
  const dt = DateTime.fromJSDate(new Date(dateTime));

  const now = DateTime.now();

  if (dt.hasSame(now, 'day')) {
    return dt.toFormat("t");
  } else if (dt.plus({ days: 1 }).hasSame(now, 'day')) {
    return "Yesterday";
  } else if (now.diff(dt, 'days').days <= 7) {
    return dt.toFormat("ccc"); // e.g. Mon, Tue
  }
  return dt.toFormat("dd LLL yyyy"); // e.g. 22 Jun 2025
}