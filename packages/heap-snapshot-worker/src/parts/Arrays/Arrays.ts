export const toSorted = <T>(array: T[], compare?: (a: T, b: T) => number): T[] => {
  return [...array].sort(compare)
}

export const sum = (values: number[]): number => {
  let total = 0
  for (const value of values) {
    total += value
  }
  return total
}

export const unique = <T>(values: T[]): T[] => {
  const seen: T[] = []
  for (const value of values) {
    if (!seen.includes(value)) {
      seen.push(value)
    }
  }
  return seen
}

export const contextMap = <T, R>(array: T[], fn: (element: T, ...context: any[]) => R, ...context: any[]): R[] => {
  const result: R[] = []
  for (const element of array) {
    result.push(fn(element, ...context))
  }
  return result
}

export const contextZipMap = <T1, T2, R>(
  array1: T1[],
  array2: T2[],
  fn: (a: T1, b: T2, ...context: any[]) => R,
  ...context: any[]
): R[] => {
  const result: R[] = []
  for (let i = 0; i < array1.length; i++) {
    const a = array1[i]
    const b = array2[i]
    result.push(fn(a, b, ...context))
  }
  return result
}
