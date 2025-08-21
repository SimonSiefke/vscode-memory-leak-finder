import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getIdSet = (snapshot: Snapshot, indices: readonly number[]): Set<number> => {
  const nodeFieldCount = snapshot.meta.node_fields.length
  const idOffset = snapshot.meta.node_fields.indexOf('id')
  if (idOffset === -1) {
    throw new Error(`node id property not found`)
  }
  const ids: number[] = []
  for (let i = 0; i < indices.length; i++) {
    const id = snapshot.nodes[i * nodeFieldCount + idOffset]
    ids.push(id)
  }
  const idSet = new Set(ids)
  return idSet
}
