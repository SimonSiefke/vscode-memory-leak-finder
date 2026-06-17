const compareInstanceCount = (a: { count: number }, b: { count: number }): number => {
  return b.count - a.count
}

const compareInstanceName = (a: { name?: string }, b: { name?: string }): number => {
  if (a.name && b.name) {
    return a.name.localeCompare(b.name)
  }
  return 0
}

export const compareInstance = (a: { count: number; name?: string }, b: { count: number; name?: string }): number => {
  return compareInstanceCount(a, b) || compareInstanceName(a, b)
}
