import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface RegexpObject {
  readonly id: number
  readonly pattern: string
}

export const getRegexpObjectsFromHeapSnapshotInternal = (snapshot: Snapshot): readonly RegexpObject[] => {
  const { nodes, strings, meta } = snapshot
  const { node_types, node_fields } = meta

  const regexpTypeIndex = node_types[0].indexOf('regexp')
  const ITEMS_PER_NODE = node_fields.length

  // Calculate field indices once
  const typeFieldIndex = node_fields.indexOf('type')
  const nameFieldIndex = node_fields.indexOf('name')
  const idFieldIndex = node_fields.indexOf('id')

  if (regexpTypeIndex === -1) {
    return []
  }

  const regexpObjects: RegexpObject[] = []

  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const typeIndex = nodes[i + typeFieldIndex]
    if (typeIndex === regexpTypeIndex) {
      const nameIndex = nodes[i + nameFieldIndex]
      const id = nodes[i + idFieldIndex]
      const pattern = strings[nameIndex] || ''

      regexpObjects.push({
        id,
        pattern,
      })
    }
  }

  // Sort by pattern length, shortest first
  return regexpObjects.sort((a, b) => a.pattern.length - b.pattern.length)
}
