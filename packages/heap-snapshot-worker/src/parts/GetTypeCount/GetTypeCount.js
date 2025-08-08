export const getTypeCount = (snapshot, typeName) => {
  const { nodes, metaData } = snapshot
  const { node_types, node_fields } = metaData.data.meta

  const typeIndex = node_types[0].indexOf(typeName)
  const ITEMS_PER_NODE = node_fields.length

  let count = 0
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const nodeType = nodes[i]
    if (nodeType === typeIndex) {
      count++
    }
  }

  return count
}
