import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import type { UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

export const getUniqueLocationMap = (
  locations: Uint32Array,
  itemsPerLocation: number,
  scriptIdOffset: number,
  lineOffset: number,
  columnOffset: number,
  toNodeIndex: number,
  nodeNameIndex: number,
  nodes: Uint32Array,
  strings: readonly string[],
): UniqueLocationMap => {
  const locationMap = Object.create(null)
  for (let i = 0; i < locations.length; i += itemsPerLocation) {
    const scriptId = locations[i + scriptIdOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]
    const nodeIndex = locations[i + toNodeIndex]
    const actualNameIndex = nodes[nodeIndex + nodeNameIndex]
    const key = getLocationKey(scriptId, lineIndex, columnIndex)
    const name = strings[actualNameIndex]
    if (key in locationMap) {
      locationMap[key].count++
      if (locationMap[key].name !== name) {
        locationMap[key].aliases ||= []
        locationMap[key].aliases.push(name)
      }
    } else {
      locationMap[key] = {
        count: 1,
        index: i / itemsPerLocation,
        name,
      }
    }
  }
  return locationMap
}
