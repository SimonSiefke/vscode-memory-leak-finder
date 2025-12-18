const compareInstanceCount = (a, b) => {
  return b.count - a.count
}

const compareInstanceName = (a, b) => {
  if (a.name && b.name) {
    return a.name.localeCompare(b.name)
  }
  return 0
}

export const compareInstance = (a, b) => {
  return compareInstanceCount(a, b) || compareInstanceName(a, b)
}
