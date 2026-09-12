export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueSlug(base: string, suffix: string): string {
  const cleanSuffix = suffix.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  const slug = slugify(base);
  return slug ? `${slug}-${cleanSuffix}` : cleanSuffix;
}
