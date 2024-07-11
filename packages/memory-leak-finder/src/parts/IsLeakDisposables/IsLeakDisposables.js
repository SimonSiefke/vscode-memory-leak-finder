const hasGreaterCount = (item) => {
  return item.count > item.oldCount || item.delta > 0
}

export const isLeakDisposables = (newItems) => {
  return newItems.some(hasGreaterCount)
}
