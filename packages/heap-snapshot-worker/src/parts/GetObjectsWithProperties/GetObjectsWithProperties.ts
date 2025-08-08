import { getObjectsWithPropertiesInternal, ObjectWithProperty } from '../GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import type { Snapshot } from '../Snapshot/Snapshot.js'

/**
 * Finds objects in a heap snapshot that have a specific property
 * @param heapSnapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @returns Array of objects with the specified property, each containing id, name, and propertyValue
 */
export const getObjectsWithProperties = (heapSnapshot: Snapshot, propertyName: string): ObjectWithProperty[] => {
  const { nodes, edges, strings, meta } = heapSnapshot

  return getObjectsWithPropertiesInternal(nodes, edges, strings, meta, propertyName)
}
