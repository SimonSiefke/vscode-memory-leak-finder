const matchesSubType = (value, subtype) => {
  return value && value.subtype && value.subtype === subtype
}

export const filterBySubType = (values, subtype) => {
  const filtered = []
  for (const value of values) {
    if (matchesSubType(value, subtype)) {
      filtered.push(value)
    }
  }
  return filtered
}
