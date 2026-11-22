/**
 * Slug Utilities for URL-friendly routing without IDs
 * Converts brand/product/category names into clean, space-free unique slugs.
 */

/**
 * Clean and sanitize a name into a lowercase, space-free slug
 * e.g. "Sony PSP" -> "sonypsp"
 * e.g. "Apple & Co." -> "appleco"
 */
export function sanitizeSlug(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .trim()
    // Remove all whitespace
    .replace(/\s+/g, '')
    // Remove all non-alphanumeric characters (keeps a-z and 0-9)
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generate a guaranteed unique slug checking against existing slugs.
 *
 * Logic:
 * 1. Base slug = sanitizeSlug(name) -> e.g. "Sony PSP" -> "sonypsp"
 * 2. If base slug count == 0 (does not exist in existingSlugs), return base slug ("sonypsp").
 * 3. Else if it already exists, append Date.now() timestamp to ensure 100% uniqueness:
 *    e.g. "apple" -> "apple1732313456789"
 *
 * @param name The source name (e.g. brand name, product name)
 * @param existingSlugs Array of existing slugs in the database/directory
 * @param currentSlugToIgnore Optional slug of the item currently being edited (so it doesn't collide with itself)
 */
export function generateUniqueSlug(
  name: string,
  existingSlugs: string[] = [],
  currentSlugToIgnore?: string
): string {
  const base = sanitizeSlug(name);
  if (!base) return '';

  const normalizedIgnore = currentSlugToIgnore ? sanitizeSlug(currentSlugToIgnore) : null;
  const normalizedExisting = new Set(
    existingSlugs
      .map((s) => sanitizeSlug(s))
      .filter((s) => s && s !== normalizedIgnore)
  );

  // If slug is not taken (count == 0), return clean base slug
  if (!normalizedExisting.has(base)) {
    return base;
  }

  // If collision exists, append unique timestamp
  const uniqueTimestamp = Date.now();
  const uniqueSlug = `${base}${uniqueTimestamp}`;

  return uniqueSlug;
}
