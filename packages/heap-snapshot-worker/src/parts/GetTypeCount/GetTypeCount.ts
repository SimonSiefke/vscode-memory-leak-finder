import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getTypeCount = (snapshot: Snapshot, typeName: string): number => {
  const { meta, nodes } = snapshot
  const { node_fields, node_types } = meta

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
