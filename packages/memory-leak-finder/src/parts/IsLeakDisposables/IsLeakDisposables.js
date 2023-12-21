const hasGreaterCount = (item) => {
  return item.count > item.oldCount
}

export const isLeakDisposables = (newItems) => {
  return newItems.some(hasGreaterCount)
}
