import type { ZodSchema, ZodError } from "zod";

/**
 * Parse and validate request data against a Zod schema.
 * Returns typed data on success, or a field-keyed error map on failure.
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };

  const errors: Record<string, string[]> = {};
  for (const issue of (result.error as ZodError).issues) {
    const path = issue.path.join(".") || "_";
    errors[path] ??= [];
    errors[path].push(issue.message);
  }
  return { success: false, errors };
}
