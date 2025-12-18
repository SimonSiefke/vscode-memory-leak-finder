import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'

interface GraphEdge {
  name: string
  index: number
}
interface Graph {
  [nodeId: number]: GraphEdge[]
}
interface ParsedNode {
  id: number
  type: string
  name: string
}
interface ArrayWithCount {
  id: number
  count: number
}

const isArray = (node: ParsedNode): boolean => {
  return node.type === 'object' && node.name === 'Array'
}

const getElementCount = (parsedNodes: readonly ParsedNode[], graph: Graph, id: number): number => {
  Assert.array(parsedNodes)
  Assert.object(graph)
  Assert.number(id)
  const edges = graph[id]
  const elementsEdge = edges.find((edge) => edge.name === 'elements')
  if (!elementsEdge) {
    return 0
  }
  const elements = parsedNodes[elementsEdge.index]
  const elementsEdges = graph[elements.id]
  return elementsEdges.length
}

const getArraysWithCount = (parsedNodes: readonly ParsedNode[], graph: Graph, arrayNodes: readonly ParsedNode[]): ArrayWithCount[] => {
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

const sortByLength = (arraysWithLength: readonly ArrayWithCount[]): ArrayWithCount[] => {
  return Arrays.toSorted(arraysWithLength, compareCount)
}

const filterByMinLength = (arrays: readonly ArrayWithCount[], minLength: number): ArrayWithCount[] => {
  return arrays.filter((array) => array.count >= minLength)
}

interface NameMapEntry {
  edgeName: string | undefined
  nodeName: string | undefined
}
interface NameMap {
  [id: number]: NameMapEntry
}
export interface ArrayWithCountAndName extends ArrayWithCount {
  name: string | undefined
}

const addNames = (items: readonly ArrayWithCount[], nameMap: NameMap): ArrayWithCountAndName[] => {
  const withNames: ArrayWithCountAndName[] = []
  for (const item of items) {
    const nameObject = nameMap[item.id]
    withNames.push({
      ...item,
      name: nameObject.edgeName || nameObject.nodeName,
    })
  }
  return withNames
}

export const getLargestArraysFromHeapSnapshot = async (id: number): Promise<ArrayWithCountAndName[]> => {
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
