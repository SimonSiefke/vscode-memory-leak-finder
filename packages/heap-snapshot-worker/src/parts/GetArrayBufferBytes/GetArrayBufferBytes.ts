import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface ArrayBufferBytes {
  readonly backingStoreCount: number
  readonly bytes: number
}

export const getArrayBufferBytes = (snapshot: Snapshot): ArrayBufferBytes => {
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const nameOffset = nodeFields.indexOf('name')
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const typeOffset = nodeFields.indexOf('type')
  const nativeType = snapshot.meta.node_types[0]?.indexOf('native') ?? -1
  let backingStoreCount = 0
  let bytes = 0
  for (let index = 0; index < snapshot.nodes.length; index += nodeFieldCount) {
    if (snapshot.nodes[index + typeOffset] !== nativeType) {
      continue
    }
    const name = snapshot.strings[snapshot.nodes[index + nameOffset]]
    if (name !== 'system / JSArrayBufferData') {
      continue
    }
    backingStoreCount++
    bytes += snapshot.nodes[index + selfSizeOffset]
  }
  return { backingStoreCount, bytes }
}
