export const toSorted = <T>(array: readonly T[], compare: (a: T, b: T) => number): T[] => {
  return [...array].sort(compare)
}
