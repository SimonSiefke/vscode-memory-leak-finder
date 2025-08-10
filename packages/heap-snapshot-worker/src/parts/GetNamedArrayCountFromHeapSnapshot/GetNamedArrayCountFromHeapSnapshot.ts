import * as Assert from '../Assert/Assert.js'
import * as CreateNameMap from '../CreateNameMap/CreateNameMap.js'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'
import * as SortCountMap from '../SortCountMap/SortCountMap.js'

interface ArrayNameWithCount {
  name: string
  count: number
}

const createCountMap = (names: string[]): Record<string, number> => {
  const map = Object.create(null)
  for (const name of names) {
    map[name] ||= 0
    map[name]++
  }
  return map
}

const filterByArray = (value: any): boolean => {
  return value.nodeName === 'Array'
}

const getValueName = (value: any): string => {
  return value.edgeName || value.nodeName
}

const getArrayNames = (nameMap: any): string[] => {
  const values = Object.values(nameMap)
  const filtered = values.filter(filterByArray)
  const mapped = filtered.map(getValueName)
  return mapped
}

const getArrayNamesWithCount = (countMap: Record<string, number>): ArrayNameWithCount[] => {
  const arrayNamesWithCount = Object.entries(countMap).map(([key, value]) => {
    return {
      name: key,
      count: value,
    }
  })
  return arrayNamesWithCount
}

export const getNamedArrayCountFromHeapSnapshot = async (id: string): Promise<ArrayNameWithCount[]> => {
  const heapsnapshot = HeapSnapshotState.get(id)

  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  const nameMap = CreateNameMap.createNameMap(parsedNodes, graph)
  const arrayNames = getArrayNames(nameMap)
  const countMap = createCountMap(arrayNames)
  const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  return sortedArrayNamesWithCount
}
