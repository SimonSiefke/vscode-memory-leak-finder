export const getObjectCountFromHeapSnapshotInternal = async (
  nodes,
  strings,
  itemsPerNode,
  typeFieldIndex,
  nameFieldIndex,
  objectTypeIndex,
  objectName,
) => {
  const objectNameIndex = strings.indexOf(objectName)
  let objectCount = 0
  for (let i = 0; i < nodes.length; i += itemsPerNode) {
    const nodeType = nodes[i + typeFieldIndex]
    if (nodeType === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      if (nameIndex === objectNameIndex) {
        objectCount++
      }
    }
  }
  return objectCount
}
