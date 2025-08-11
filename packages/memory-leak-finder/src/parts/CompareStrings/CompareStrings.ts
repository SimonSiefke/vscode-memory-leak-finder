export const compareStrings = (before, after) => {
  const beforeSet = new Set(before)
  const newStrings = []
  for (const string of after) {
    if (!beforeSet.has(string)) {
      newStrings.push(string)
    }
  }
  return newStrings
}
