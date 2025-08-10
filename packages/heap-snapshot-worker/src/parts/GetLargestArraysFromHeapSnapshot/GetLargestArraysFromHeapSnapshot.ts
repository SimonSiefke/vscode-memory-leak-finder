import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

interface ArrayNode {
  id: number
  type: string
  name: string
}

interface ArrayWithCount {
  id: number
  count: number
}

interface ArrayWithName extends ArrayWithCount {
  name: string
}

const isArray = (node: any): node is ArrayNode => {
  return node.type === 'object' && node.name === 'Array'
}

const getElementCount = (parsedNodes: any[], graph: any, id: number): number => {
  Assert.array(parsedNodes)
  Assert.object(graph)
  Assert.number(id)
  const edges = graph[id]
  const elementsEdge = edges.find((edge: any) => edge.name === 'elements')
  if (!elementsEdge) {
    return 0
  }
  const elements = parsedNodes[elementsEdge.index]
  const elementsEdges = graph[elements.id]
  return elementsEdges.length
}

const getArraysWithCount = (parsedNodes: any[], graph: any, arrayNodes: ArrayNode[]): ArrayWithCount[] => {
  const withCount: ArrayWithCount[] = []
  for (const arrayNode of arrayNodes) {
    const count = getElementCount(parsedNodes, graph, arrayNode.id)
    withCount.push({
      id: arrayNode.id,
      count,
    })
  }
  return withCount
}

const compareCount = (a: ArrayWithCount, b: ArrayWithCount): number => {
  return b.count - a.count
}

const sortByLength = (arraysWithLength: ArrayWithCount[]): ArrayWithCount[] => {
  return Arrays.toSorted(arraysWithLength, compareCount)
}

const filterByMinLength = (arrays: ArrayWithCount[], minLength: number): ArrayWithCount[] => {
  return arrays.filter((array) => array.count >= minLength)
}

const addNames = (items: ArrayWithCount[], nameMap: any): ArrayWithName[] => {
  const withNames: ArrayWithName[] = []
  for (const item of items) {
    const nameObject = nameMap[item.id]
    withNames.push({
      ...item,
      name: nameObject.edgeName || nameObject.nodeName,
    })
  }
  return withNames
}

export const getLargestArraysFromHeapSnapshot = async (id: string): Promise<ArrayWithName[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)
  Assert.object(heapsnapshot)
  const minLength = 1
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const arrayNodes = parsedNodes.filter(isArray)
  const arraysWithLength = getArraysWithCount(parsedNodes, graph, arrayNodes)
  const filtered = filterByMinLength(arraysWithLength, minLength)
  const sorted = sortByLength(filtered)
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  const sortedWithNames = addNames(sorted, nameMap)
  return sortedWithNames
}
