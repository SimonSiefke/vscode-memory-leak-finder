import type { Dynamic } from '../Types/Types.ts'
export const compareStrings = (before: Dynamic, after: Dynamic) => {
  const beforeSet = new Set(before)
  const newStrings: Dynamic[] = []
  for (const string of after) {
    if (!beforeSet.has(string)) {
      newStrings.push(string)
    }
  }
  return newStrings
}
