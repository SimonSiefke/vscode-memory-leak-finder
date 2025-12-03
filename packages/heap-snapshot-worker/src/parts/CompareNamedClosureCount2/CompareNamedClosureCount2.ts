import { getNewItems } from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

const createKeyMap = (keys) => {
  const map = Object.create(null)
  for (const key of keys) {
    map[key] = true
  }
  return map
}

const getMatchingNodes = (snapshot: Snapshot, keyMap: any): readonly any[] => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset, objectIndexOffset } = getLocationFieldOffsets(
    snapshot.meta.location_fields,
  )
  const { nodes, locations, strings } = snapshot
  const nodeNameOffset = snapshot.meta.node_fields.indexOf('name')

  // TODO get the nodes whose location index matches the index

  const matchingNodes: any[] = []

  for (let i = 0; i < locations.length; i += itemsPerLocation) {
    const scriptId = locations[i + scriptIdOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]
    const key = getLocationKey(scriptId, lineIndex, columnIndex)
    if (key in keyMap) {
      // this one is leaked, get the node
      const nodeIndex = locations[i + objectIndexOffset]
      const nodeNameIndex = nodes[nodeIndex + nodeNameOffset]
      const nodeName = strings[nodeNameIndex] || 'anonymous'
      matchingNodes.push({
        nodeIndex,
        nodeName,
      })
    }
  }
  return matchingNodes
}

export const compareNamedClosureCountFromHeapSnapshot2 = async (pathA: string, pathB: string): Promise<any[]> => {
  console.time('parse')
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  console.timeEnd('parse')

  const minCount = 1
  const map1 = getUniqueLocationMap2(snapshotA)
  const map2 = getUniqueLocationMap2(snapshotB)
  const newItems = getNewItems(map1, map2, minCount)
  const keys = newItems.map((item) => item.key)
  const keyMap = createKeyMap(keys)
  const oldMatchingNodes = getMatchingNodes(snapshotA, keyMap)
  const newMatchingNodes = getMatchingNodes(snapshotB, keyMap)

  // TODO now that we have indices of leaked locations
  // we need to loop over all nodes, check which nodes are of type closure
  // and whose location matches the index in indexmap (locations)

  console.log({ oldMatchingNodes, newMatchingNodes })

  return []
}
