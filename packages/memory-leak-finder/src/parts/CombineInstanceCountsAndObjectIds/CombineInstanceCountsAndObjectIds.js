export const combineInstanceCountsAndObjectIds = (instanceCounts, objectIds) => {
  const result = []
  for (let i = 0; i < instanceCounts.length; i++) {
    const instance = instanceCounts[i]
    const objectId = objectIds[i]
    result.push({ ...instance, objectId })
  }
  return result
}
