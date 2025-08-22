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

export const contextMap = <T, R, C extends unknown[]>(array: readonly T[], fn: (element: T, ...context: C) => R, ...context: C): R[] => {
  const result: R[] = []
  for (const element of array) {
    result.push(fn(element, ...context))
  }
  return result
}

export const contextZipMap = <A, B, R, C extends unknown[]>(
  array1: readonly A[],
  array2: readonly B[],
  fn: (a: A, b: B, ...context: C) => R,
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
