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
  const nodeTypes = snapshot.meta.node_types[typeOffset]
  const stringTypes = new Set(
    ['string', 'concatenated string', 'sliced string'].map((type) => nodeTypes.indexOf(type)).filter((type) => type !== -1),
  )
  let bytes = 0
  let count = 0

  for (let index = 0; index < snapshot.nodes.length; index += nodeFieldCount) {
    if (stringTypes.has(snapshot.nodes[index + typeOffset])) {
      count++
      bytes += snapshot.nodes[index + selfSizeOffset]
    }
  }

  return { bytes, count }
}
