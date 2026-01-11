export const toSorted = <T>(array: readonly T[], compare: (a: T, b: T) => number): T[] => {
  return [...array].sort(compare)
}

export const sum = (values: readonly number[]): number => {
  let total = 0
  for (const value of values) {
    total += value
  }
  return total
}

export const unique = <T>(values: readonly T[]): T[] => {
  const seen: T[] = []
  for (const value of values) {
    if (!seen.includes(value)) {
      seen.push(value)
    }
  }
  return seen
}

export const contextMap = <T, R, C extends readonly unknown[]>(
  array: readonly T[],
  fn: (element: T, ...context: C) => R,
  ...context: C
): R[] => {
  const result: R[] = []
  for (const element of array) {
    result.push(fn(element, ...context))
  }
  return result
}

export const contextZipMap = <T1, T2, R, C extends readonly unknown[]>(
  array1: readonly T1[],
  array2: readonly T2[],
  fn: (a: T1, b: T2, ...context: C) => R,
  ...context: C
): R[] => {
  const result: R[] = []
  for (let i = 0; i < array1.length; i++) {
    const a = array1[i]
    const b = array2[i]
    result.push(fn(a, b, ...context))
  }
  return result
}
