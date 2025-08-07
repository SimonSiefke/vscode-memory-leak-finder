export const parseHeapSnapshotArrayHeader = (data, name) => {
  const token = `"${name}":`

  const tokenIndex = data.indexOf(token)

  if (tokenIndex === -1) {
    return -1
  }
  const startIndex = tokenIndex + token.length
  const bracketIndex = data.indexOf('[', startIndex)

  if (bracketIndex === -1) {
    return -1
  }
  return bracketIndex + 1
}
