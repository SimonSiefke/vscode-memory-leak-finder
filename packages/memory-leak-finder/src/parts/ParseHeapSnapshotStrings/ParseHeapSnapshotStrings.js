export const parseHeapSnapshotStrings = (heapsnapshot) => {
  const { strings } = heapsnapshot
  if (!Array.isArray(strings)) {
    throw new Error('no strings found')
  }
  return strings
}
