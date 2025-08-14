import { getObjectsWithPropertiesInternal } from '../GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

/**
 * Finds objects in a heap snapshot that have a specific property
 * @param heapSnapshot - The parsed heap snapshot object
 * @param propertyName - The property name to search for
 * @param depth - Maximum depth to traverse for property collection (default: 1)
 * @returns Array of objects with the specified property, each containing id, name, propertyValue, and properties
 */
export const getObjectsWithProperties = (heapSnapshot: Snapshot, propertyName: string, depth: number = 1): readonly PrintedValue[] => {
  return getObjectsWithPropertiesInternal(heapSnapshot, propertyName, depth)
}
