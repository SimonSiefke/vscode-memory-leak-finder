import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'

/**
 * Counts DOM timers (setTimeout/setInterval) from heap snapshot
 * @param {import('../Snapshot/Snapshot.ts').Snapshot} snapshot
 * @returns {number}
 */
export const getDomTimerCountFromHeapSnapshotInternal = (snapshot) => {
  const { nodes, strings, meta } = snapshot
  const { node_types, node_fields, edge_types, edge_fields } = meta
  const { objectTypeIndex, nativeTypeIndex, ITEMS_PER_NODE, typeFieldIndex, nameFieldIndex } = computeHeapSnapshotIndices(
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
