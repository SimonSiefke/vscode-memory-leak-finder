import { getThingCountFromHeapSnapshot } from '../GetThingCountFromHeapSnapshot/GetThingCountFromHeapSnapshot.js'

export const getRegexCountFromHeapSnapshot = async (path) => {
  return getThingCountFromHeapSnapshot(path, 'regexp', 'RegExp')
}
