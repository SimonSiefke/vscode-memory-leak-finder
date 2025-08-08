import { getObjectCountFromHeapSnapshot } from '../GetObjectCountFromHeapSnapshot/GetObjectCountFromHeapSnapshot.js'

export const getMapCountFromHeapSnapshot = async (path) => {
  return getObjectCountFromHeapSnapshot(path, 'Map')
}
