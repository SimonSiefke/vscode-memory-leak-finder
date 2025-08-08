import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { getObjectsWithPropertiesInternal, ObjectWithProperty } from '../GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.js'

/**
 * Finds objects in a heap snapshot that have a specific property
 * @param path - Path to the heap snapshot file
 * @param propertyName - The property name to search for
 * @returns Array of objects with the specified property, each containing id, name, and propertyValue
 */
export const getObjectsWithProperties = async (path: string, propertyName: string): Promise<ObjectWithProperty[]> => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, edges, strings, meta } = snapshot
  
  return getObjectsWithPropertiesInternal(nodes, edges, strings, meta, propertyName)
}
