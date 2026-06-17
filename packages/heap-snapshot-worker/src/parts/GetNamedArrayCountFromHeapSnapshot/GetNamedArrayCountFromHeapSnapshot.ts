import * as Assert from '../Assert/Assert.ts'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import * as SortCountMap from '../SortCountMap/SortCountMap.ts'
import type { CountItem } from '../Snapshot/Snapshot.ts'

export interface NamedArrayLocation {
  readonly column: number
  readonly line: number
  readonly scriptId: number
  readonly sourceMapUrl: string
  readonly url: string
}

export interface NamedArrayCountItem extends CountItem {
  readonly locations?: readonly NamedArrayLocation[]
}

const createCountMap = (names: readonly string[]): Record<string, number> => {
  const map: Record<string, number> = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
}

const filterByArray = (value: CreateNameMap.NameMapEntry): boolean => {
  return value.nodeName === 'Array'
}

const getValueName = (value: CreateNameMap.NameMapEntry): string => {
  return value.edgeName || value.nodeName
}

const getArrayNames = (nameMap: Record<number, CreateNameMap.NameMapEntry>): readonly string[] => {
  const values = Object.values(nameMap)
  const filtered = values.filter(filterByArray)
  const mapped = filtered.map(getValueName)
  return mapped
}

const getArrayNamesWithCount = (countMap: Readonly<Record<string, number>>): readonly NamedArrayCountItem[] => {
  const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
    return {
      count: value,
      name: key,
    }
  })
  return arrayNamesWithCount
}

export const getNamedArrayCountFromHeapSnapshot = async (
  id: string,
  scriptMap: Readonly<Record<string, unknown>> = {},
): Promise<readonly NamedArrayCountItem[]> => {
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
