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
