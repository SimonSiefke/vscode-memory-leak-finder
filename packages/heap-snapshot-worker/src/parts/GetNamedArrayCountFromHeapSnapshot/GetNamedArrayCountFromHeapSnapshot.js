import * as Assert from '../Assert/Assert.js'
import { computeHeapSnapshotIndices } from '../ComputeHeapSnapshotIndices/ComputeHeapSnapshotIndices.js'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.js'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import * as SortCountMap from '../SortCountMap/SortCountMap.js'

// const createCountMap = (names) => {
//   const map = Object.create(null)
//   for (const name of names) {
//     map[name] ||= 0
//     map[name]++
//   }
//   return map
// }

// const filterByArray = (value) => {
//   return value.nodeName === 'Array'
// }

// const getValueName = (value) => {
//   return value.edgeName || value.nodeName
// }

// const getArrayNames = (nameMap) => {
//   const values = Object.values(nameMap)
//   const filtered = values.filter(filterByArray)
//   const mapped = filtered.map(getValueName)
//   return mapped
// }

// const getArrayNamesWithCount = (countMap) => {
//   const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
//     return {
//       name: key,
//       count: value,
//     }
//   })
//   return arrayNamesWithCount
// }

export const getNamedArrayCountFromHeapSnapshot = async (path) => {
  const snapshot = await prepareHeapSnapshot(path, {
    parseStrings: true,
  })
  const { nodes, edges, strings, metaData } = snapshot
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(metaData.data.meta.location_fields)
  const { node_types, node_fields, edge_types, edge_fields, location_fields } = metaData.data.meta
  const {
    objectTypeIndex,
    ITEMS_PER_NODE,
    ITEMS_PER_EDGE,
    typeFieldIndex,
    nameFieldIndex,
    idFieldIndex,
    selfSizeFieldIndex,
    edgeCountFieldIndex,
    detachednessFieldIndex,
    traceNodeIdFieldIndex,
    edgeTypeFieldIndex,
    edgeNameFieldIndex,
    edgeToNodeFieldIndex,
    edgeTypes,
    nodeTypes,
    arrayTypeIndex,
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  const map = Object.create(null)
  for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
    const nodeType = nodes[i + typeFieldIndex]
    if (nodeType === arrayTypeIndex) {
      const name = nodes[i + nameFieldIndex]
      map[name] ||= 0
      map[name]++
    }
  }
  console.log({ map })
  return []
}
