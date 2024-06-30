import * as Assert from '../Assert/Assert.js'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.js'

export const getNamedArrayCountFromHeapSnapshot = async (heapsnapshot) => {
  Assert.object(heapsnapshot)
  const { parsedNodes, graph } = ParseHeapSnapshot.parseHeapSnapshot(heapsnapshot)
  // const nameMap = createNameMap(parsedNodes, graph)
  // const arrayNames = getArrayNames(nameMap)
  // const countMap = createCountMap(arrayNames)
  // const arrayNamesWithCount = getArrayNamesWithCount(countMap)
  // const sortedArrayNamesWithCount = SortCountMap.sortCountMap(arrayNamesWithCount)
  // const map = createFinalMap(sortedArrayNamesWithCount)
  console.log({ heapsnapshot })
  return {}
}
