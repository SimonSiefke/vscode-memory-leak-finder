export const compareStrings = (before: unknown, after: unknown): readonly string[] => {
  const beforeSet = new Set(before as readonly string[])
  const newStrings: string[] = []
  for (const string of after as readonly string[]) {
    if (!beforeSet.has(string)) {
      newStrings.push(string)
    }
  }
  return newStrings
}
