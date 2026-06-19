type ScopedQuestion = {
  categorySlugs: unknown;
};

export function appliesToCategory(
  question: ScopedQuestion,
  categorySlug: string,
): boolean {
  if (!Array.isArray(question.categorySlugs)) return true;
  return question.categorySlugs.includes(categorySlug);
}
