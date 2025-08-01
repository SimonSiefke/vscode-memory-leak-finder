const emptyItem = {
  count: 0,
}

const ITEMS_PER_LOCATION = 4
const scriptOffset = 1
const lineOffset = 2
const columnOffset = 3

export const compareHeapSnapshotFunctionsInternal = (result1, result2) => {
  const map1 = result1.map
  const map2 = result2.map
  const locations2 = result2.locations
  const array = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0) {
      const scriptId = locations2[newItem.index * ITEMS_PER_LOCATION + scriptOffset]
      const line = locations2[newItem.index * ITEMS_PER_LOCATION + lineOffset]
      const column = locations2[newItem.index * ITEMS_PER_LOCATION + columnOffset]
      array.push({
        column,
        count: newItem.count,
        delta,
        line,
        scriptId,
      })
    }
  }
  array.sort((a, b) => b.count - a.count)
  return array
}
