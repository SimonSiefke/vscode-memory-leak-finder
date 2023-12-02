export const compareInstance = (a, b) => {
  return b.count - a.count || a.name.localeCompare(b.name)
}
