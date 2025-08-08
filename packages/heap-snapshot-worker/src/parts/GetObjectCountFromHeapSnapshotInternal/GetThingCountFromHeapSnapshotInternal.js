export const getThingCountFromHeapSnapshotInternal = async (
  nodes,
  strings,
  itemsPerNode,
  typeFieldIndex,
  nameFieldIndex,
  typeIndex,
  objectName,
) => {
  const objectNameIndex = strings.indexOf(objectName)
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
