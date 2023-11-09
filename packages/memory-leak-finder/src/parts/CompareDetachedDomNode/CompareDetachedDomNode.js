export const compareDetachedDomNode = (a, b) => {
  if (!a.description) {
    return b
  }
  if (!b.description) {
    return a
  }
  return a.description.localeCompare(b.description)
}
