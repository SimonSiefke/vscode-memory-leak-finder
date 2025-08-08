import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

export const getMapCountFromHeapSnapshot = async (path) => {
  return getThingCountFromHeapSnapshot(path, 'object', 'Map')
}
