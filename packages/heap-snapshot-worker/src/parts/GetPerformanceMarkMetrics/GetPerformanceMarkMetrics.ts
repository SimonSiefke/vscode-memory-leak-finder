import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface PerformanceMarkMetrics {
  readonly bytes: number
  readonly count: number
}

export const getPerformanceMarkMetrics = (snapshot: Snapshot): PerformanceMarkMetrics => {
  const nodeFields = snapshot.meta.node_fields
  const nodeFieldCount = nodeFields.length
  const nameOffset = nodeFields.indexOf('name')
  const selfSizeOffset = nodeFields.indexOf('self_size')
  const typeOffset = nodeFields.indexOf('type')
  const nativeType = snapshot.meta.node_types[0]?.indexOf('native') ?? -1
  let bytes = 0
  let count = 0

  for (let index = 0; index < snapshot.nodes.length; index += nodeFieldCount) {
    if (snapshot.nodes[index + typeOffset] !== nativeType) {
      continue
    }
    const name = snapshot.strings[snapshot.nodes[index + nameOffset]]
    if (name !== 'PerformanceMark') {
      continue
    }
    count++
    bytes += snapshot.nodes[index + selfSizeOffset]
  }

  return { bytes, count }
}
