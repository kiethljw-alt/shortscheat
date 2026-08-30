export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function uniqueSlug(base: string, suffix: string): string {
  const slug = slugify(base) || "project";
  return `${slug}-${suffix}`;
}
