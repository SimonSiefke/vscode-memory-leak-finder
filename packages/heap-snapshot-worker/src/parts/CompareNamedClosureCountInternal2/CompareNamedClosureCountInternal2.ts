import { getNewItems } from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
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
  const nodeIdOffset = snapshot.meta.node_fields.indexOf('id')

  // TODO get the nodes whose location index matches the index

  const matchingNodeMap = Object.create(null)

  for (let i = 0; i < locations.length; i += itemsPerLocation) {
    const scriptId = locations[i + scriptIdOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]
    const key = getLocationKey(scriptId, lineIndex, columnIndex)
    if (key in keyMap) {
      matchingNodeMap[key] ||= []
      // this one is leaked, get the node
      const nodeIndex = locations[i + objectIndexOffset]
      const nodeNameIndex = nodes[nodeIndex + nodeNameOffset]
      const nodeId = nodes[nodeIndex + nodeIdOffset]
      const nodeName = strings[nodeNameIndex] || 'anonymous'
      matchingNodeMap[key].push({
        nodeIndex,
        nodeName,
        nodeId,
      })
    }
  }
  return matchingNodeMap
}

const getNodeHash = (node) => {
  return `${node.nodeName}:${node.nodeId}`
}

const getLeaked = (oldNodeMap, newNodeMap) => {
  const leakedMap = Object.create(null)
  const keys = Object.keys(oldNodeMap)
  for (const key of keys) {
    leakedMap[key] = []
    const oldItems = oldNodeMap[key]
    const newItems = newNodeMap[key]
    const seen = Object.create(null)
    for (const item of oldItems) {
      const hash = getNodeHash(item)
      seen[hash] = true
    }

    for (const item of newItems) {
      const hash = getNodeHash(item)
      if (!(hash in seen)) {
        leakedMap[key].push(item)
      }
    }
  }
  return leakedMap
}

export interface CompareClosuresOptions {
  readonly minCount?: number
  readonly excludeOriginalPaths?: readonly string[]
}

export const compareNamedClosureCountFromHeapSnapshotInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  options: CompareClosuresOptions = {},
): Promise<any> => {
  const minCount = options.minCount ?? 1
  const map1 = getUniqueLocationMap2(snapshotA)
  const map2 = getUniqueLocationMap2(snapshotB)
  const newItems = getNewItems(map1, map2, minCount)
  const keys = newItems.map((item) => item.key)
  const keyMap = createKeyMap(keys)
  const oldMatchingNodes = getMatchingNodes(snapshotA, keyMap)
  const newMatchingNodes = getMatchingNodes(snapshotB, keyMap)
  const leaked = getLeaked(oldMatchingNodes, newMatchingNodes)
  return leaked
}
