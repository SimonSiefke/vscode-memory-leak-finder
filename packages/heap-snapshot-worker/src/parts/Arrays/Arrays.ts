export const toSorted = (array, compare) => {
  return [...array].sort(compare)
}

export const sum = (values) => {
  let total = 0
  for (const value of values) {
    total += value
  }
  return total
}

export const unique = (values) => {
  const seen = []
  for (const value of values) {
    if (!seen.includes(value)) {
      seen.push(value)
    }
  }
  return seen
}

export const contextMap = (array, fn, ...context) => {
  const result = []
  for (const element of array) {
    result.push(fn(element, ...context))
  }
  return result
}

export const contextZipMap = (array1, array2, fn, ...context) => {
  const result = []
  for (let i = 0; i < array1.length; i++) {
    const a = array1[i]
    const b = array2[i]
    result.push(fn(a, b, ...context))
  }
  return result
}
