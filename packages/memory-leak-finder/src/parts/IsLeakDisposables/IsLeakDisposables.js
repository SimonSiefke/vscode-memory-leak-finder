const getTotalCount = (values) => {
  let total = 0
  for (const value of values) {
    total += value.count
  }
  return total
}

export const isLeakDisposables = ({ before, after }) => {
  const totalBefore = getTotalCount(before)
  const totalAfter = getTotalCount(after)
  return totalAfter > totalBefore
}
