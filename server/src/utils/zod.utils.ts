import { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return error.errors.map((e) => e.message).join(", ");
}
