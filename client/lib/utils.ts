import { clsx, type ClassValue } from "clsx"
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge"
import { Message } from "./index.types";

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

export async function sleep(ms: number){
  return new Promise((resolve) => setTimeout(() => resolve("Success"), ms));
}

/**
 * Removes duplicate objects by their `id` field.
 * Later items overwrite earlier ones with the same id.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

/**
 * Sorts messages in ascending order of `createdAt`.
 * Assumes `createdAt` is an ISO string or Date.
 */
export function byCreatedAtAsc(a: Message, b: Message): number {
  const bTime = DateTime.fromJSDate(new Date(b.createdAt)).toMillis();
  const aTime = DateTime.fromJSDate(new Date(a.createdAt)).toMillis();
  return aTime - bTime;
}