import * as Assert from '../Assert/Assert.ts'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'

const createCountMap = (names: string[]) => {
  const map = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
}

interface NameMapValue {
  readonly nodeName: string
  readonly edgeName?: string
}

const filterByArray = (value: NameMapValue): boolean => {
  return value.nodeName === 'Array'
}

const getValueName = (value: NameMapValue): string => {
  return value.edgeName || value.nodeName
}

const getArrayNames = (nameMap: Record<string, NameMapValue>): readonly string[] => {
  const values = Object.values(nameMap)
  const filtered = values.filter(filterByArray)
  const mapped = filtered.map(getValueName)
  return mapped
}

interface CountResult {
  readonly count: number
  readonly name: string
}

const getArrayNamesWithCount = (countMap: Record<string, number>): readonly CountResult[] => {
  const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
    return {
      count: value,
      name: key,
    }
  })
  return arrayNamesWithCount
}

export const getNamedArrayCountFromHeapSnapshot = async (
  id: number,
  scriptMap: Record<string, unknown> = {},
): Promise<readonly CountResult[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)

  Assert.object(heapsnapshot)
  const { graph, parsedNodes } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  const arrayNames = getArrayNames(nameMap)
  const countMap = createCountMap(arrayNames)
  const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  return sortedArrayNamesWithCount
}
