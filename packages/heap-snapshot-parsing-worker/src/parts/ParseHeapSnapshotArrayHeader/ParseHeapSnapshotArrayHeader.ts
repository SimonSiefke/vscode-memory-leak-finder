export const parseHeapSnapshotArrayHeader = (data, name) => {
  const token = `"${name}":`
  console.log('parseHeapSnapshotArrayHeader - looking for token:', token)
  console.log('parseHeapSnapshotArrayHeader - data length:', data.length)
  console.log('parseHeapSnapshotArrayHeader - data start:', data.substring(0, 200))
  console.log('parseHeapSnapshotArrayHeader - data end:', data.substring(data.length - 200))
  
  const tokenIndex = data.indexOf(token)
  console.log('parseHeapSnapshotArrayHeader - tokenIndex:', tokenIndex)
  
  if (tokenIndex === -1) {
    console.log('parseHeapSnapshotArrayHeader - token not found')
    return -1
  }
  const startIndex = tokenIndex + token.length
  const bracketIndex = data.indexOf('[', startIndex)
  console.log('parseHeapSnapshotArrayHeader - bracketIndex:', bracketIndex)
  
  if (bracketIndex === -1) {
    console.log('parseHeapSnapshotArrayHeader - bracket not found')
    return -1
  }
  return bracketIndex + 1
}
