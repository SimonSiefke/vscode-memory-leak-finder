import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const countArrays = (snapshot: Snapshot): number => {
  const { nodes, strings } = snapshot
  const meta = snapshot.meta
  const { node_fields, node_types } = meta

  const nodeFieldCount = node_fields.length
  const nameFieldIndex = node_fields.indexOf('name')
  const typeFieldIndex = node_fields.indexOf('type')
  const nodeTypes = node_types[0] || []
  const nodeTypeObject = nodeTypes.indexOf('object')

  let arrayCount = 0

  for (let i = 0; i < nodes.length; i += nodeFieldCount) {
    const typeIndex = nodes[i + typeFieldIndex]
    const nameIndex = nodes[i + nameFieldIndex]
    const name = strings[nameIndex]

    if (typeIndex === nodeTypeObject && name === 'Array') {
      arrayCount++
    }
  }

  return arrayCount
}

export const compareGrowingArraysInternal = (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
): { aCount: number; bCount: number } => {
  const aCount = countArrays(snapshotA)
  const bCount = countArrays(snapshotB)
  return { aCount, bCount }
}

