import { getNewItems } from '../CompareHeapSnapshotsFunctionsInternal2/CompareHeapSnapshotsFunctionsInternal2.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const createIndexMap = (indices) => {
  const map = Object.create(null)
  for (const index of indices) {
    map[index] = true
  }
  return map
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
  const indices = newItems.map((item) => item.index)
  const indexMap = createIndexMap(indices)

  console.log({ indexMap })

  return []
}
