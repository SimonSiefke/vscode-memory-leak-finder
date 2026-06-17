export const compareLargestArrayCount = (before: unknown, after: unknown): readonly { delta: number; length: number; name: string }[] => {
  const beforeMap: { [id: string]: number } = Object.create(null)
  for (const item of before as readonly { id: string; count: number }[]) {
    beforeMap[item.id] = item.count
  }
  const leaked: { delta: number; length: number; name: string }[] = []
  for (const item of after as readonly { id: string; count: number; name: string }[]) {
    const afterCount = item.count
    const beforeCount = beforeMap[item.id] || 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        delta,
        length: afterCount,
        name: item.name,
      })
    }
  }
  return leaked
}
