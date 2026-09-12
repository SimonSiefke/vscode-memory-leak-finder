import type { Snapshot } from '../Snapshot/Snapshot.ts'

export const getNativeContextCount = (snapshot: Snapshot): number => {
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const nameOffset = nodeFields.indexOf('name')
  const typeOffset = nodeFields.indexOf('type')
  const hiddenType = snapshot.meta.node_types[0]?.indexOf('hidden') ?? -1
  let count = 0
  for (let index = 0; index < snapshot.nodes.length; index += nodeFieldCount) {
    if (snapshot.nodes[index + typeOffset] !== hiddenType) {
      continue
    }
    const name = snapshot.strings[snapshot.nodes[index + nameOffset]]
    if (typeof name === 'string' && (name === 'system / NativeContext' || name.startsWith('system / NativeContext / '))) {
      count++
    }
  }
  return count
}
