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
  } = computeHeapSnapshotIndices(node_types, node_fields, edge_types, edge_fields)

  console.log({ ITEMS_PER_EDGE, ITEMS_PER_NODE, nameFieldIndex })
  // console.log({ snapshot })
  // const heapsnapshot = HeapSnapshotState.get(id)

  // Assert.object(heapsnapshot)
  // const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  // const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  // const arrayNames = getArrayNames(nameMap)
  // const countMap = createCountMap(arrayNames)
  // const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  // const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  return []
}

getNamedArrayCountFromHeapSnapshot('/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json')
