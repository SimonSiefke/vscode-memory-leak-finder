export const compareStrings2 = (before: string, after: string) => {
  const beforeSet = new Set(before)
  const newStrings: any[] = []
  for (const string of after) {
    if (!beforeSet.has(string)) {
      newStrings.push(string)
    }
  }
  return newStrings
}
