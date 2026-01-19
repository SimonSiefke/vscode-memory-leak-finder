import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.ts'

/**
 * Counts DOM timers (setTimeout/setInterval) from heap snapshot
 */
export const getDomTimerCountFromHeapSnapshotInternal = (snapshot: Snapshot): number => {
  const { meta, nodes, strings } = snapshot
  const { edge_fields, edge_types, node_fields, node_types } = meta
  const { ITEMS_PER_NODE, nameFieldIndex, nativeTypeIndex, objectTypeIndex, typeFieldIndex } = computeHeapSnapshotIndices(
    node_types,
    node_fields,
    edge_types,
    edge_fields,
  )

  let timerCount = 0

  // Look for DOM timer objects in the heap snapshot
  // DOM timers are identified by the "DOMTimer" string
  const domTimerStringIndex = strings.indexOf('DOMTimer')

  if (domTimerStringIndex !== -1) {
    // Single pass: find objects with DOMTimer name
    for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
      const typeIndex = nodes[i + typeFieldIndex]
      // Check both object and native types
      if (typeIndex === objectTypeIndex || typeIndex === nativeTypeIndex) {
        const nameIndex = nodes[i + nameFieldIndex]

        // Check if this object name is exactly "DOMTimer"
        if (nameIndex === domTimerStringIndex) {
          timerCount++
        }
      }
    }
  }

  return timerCount
}
