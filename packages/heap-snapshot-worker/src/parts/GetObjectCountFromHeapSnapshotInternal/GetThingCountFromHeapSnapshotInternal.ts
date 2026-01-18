export const getThingCountFromHeapSnapshotInternal = (
  nodes: Uint32Array,
  strings: readonly string[],
  itemsPerNode: number,
  typeFieldIndex: number,
  nameFieldIndex: number,
  typeIndex: number,
  objectName: string,
): number => {
  const objectNameIndex = strings.indexOf(objectName)
  const objectNameIndexLast = strings.lastIndexOf(objectName)
  if (objectNameIndex !== objectNameIndexLast) {
    throw new Error(`object name is ambiguous`)
  }
  let objectCount = 0
  for (let i = 0; i < nodes.length; i += itemsPerNode) {
    const nodeType = nodes[i + typeFieldIndex]
    if (nodeType === typeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      if (nameIndex === objectNameIndex) {
        objectCount++
      }
    }
  }
  return objectCount
}
