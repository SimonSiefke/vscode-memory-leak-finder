const emptyItem = {
  count: 0,
}

export const compare = (result1, result2) => {
  const map1 = result1.map
  const map2 = result2.map
  const array = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0) {
      array.push({
        count: newItem.count,
        delta,
      })
    }
  }
  array.sort((a, b) => b.count - a.count)
  return array
}
