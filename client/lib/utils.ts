import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 *  Generates a random Tailwind CSS color class.
 * @param type - The type of Tailwind CSS class to generate (e.g., "bg", "text", "border").
 *               Defaults to "bg" for background colors.
 * @returns A string representing a random Tailwind CSS color class in the format "bg-color-shade".
 */
export function getRandomTailwindColor(type = "bg") {
  const colors = [
    "slate", "gray", "zinc", "neutral", "stone",
    "red", "orange", "amber", "yellow", "lime",
    "green", "emerald", "teal", "cyan", "sky",
    "blue", "indigo", "violet", "purple", "fuchsia",
    "pink", "rose"
  ];

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  const color = colors[Math.floor(Math.random() * colors.length)];
  const shade = shades[Math.floor(Math.random() * shades.length)];

  return `${type}-${color}-${shade}`;
}