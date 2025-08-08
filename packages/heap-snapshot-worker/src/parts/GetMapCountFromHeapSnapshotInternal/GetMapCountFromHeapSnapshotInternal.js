export const getMapCountFromHeapSnapshotInternal = async (
  nodes,
  strings,
  itemsPerNode,
  typeFieldIndex,
  nameFieldIndex,
  objectTypeIndex,
) => {
  const mapStringIndex = strings.indexOf('Map')
  let mapCount = 0
  for (let i = 0; i < nodes.length; i += itemsPerNode) {
    const nodeType = nodes[i + typeFieldIndex]
    if (nodeType === objectTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      if (nameIndex === mapStringIndex) {
        mapCount++
      }
    }
  }
  return mapCount
}
