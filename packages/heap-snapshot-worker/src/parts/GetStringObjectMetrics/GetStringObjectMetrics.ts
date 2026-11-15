import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface StringObjectMetrics {
  readonly bytes: number
  readonly count: number
}

export const getStringObjectMetrics = (snapshot: Snapshot): StringObjectMetrics => {
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const typeOffset = nodeFields.indexOf('type')
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const edgeCountOffset = nodeFields.indexOf('edge_count')
  const nodeTypes = snapshot.meta.node_types[typeOffset]
  const stringTypes = new Set(
    ['string', 'concatenated string', 'sliced string'].map((type) => nodeTypes.indexOf(type)).filter((type) => type !== -1),
  )
  let bytes = 0
  let count = 0

  for (let index = 0; index < snapshot.nodes.length; index += nodeFieldCount) {
    if (stringTypes.has(snapshot.nodes[index + typeOffset])) {
      const selfSize = snapshot.nodes[index + selfSizeOffset]
      // V8 emits zero-size leaf strings to annotate numeric values and internal
      // fields. Real read-only strings can also have zero size, but have map edges.
      if (selfSize === 0 && snapshot.nodes[index + edgeCountOffset] === 0) continue
      count++
      bytes += selfSize
    }
  }

  return { bytes, count }
}
