export const combine = (...measures) => {
  const start = async () => {
    const beforeMap = Object.create(null)
    for (const measure of measures) {
      beforeMap[measure.id] = await measure.start()
    }
    return beforeMap
  }

  const stop = async () => {
    const afterMap = Object.create(null)
    for (const measure of measures) {
      afterMap[measure.id] = await measure.stop()
    }
    return afterMap
  }

  const compare = (before, after) => {
    const resultMap = Object.create(null)
    for (const measure of measures) {
      resultMap[measure.id] = measure.compare(before[measure.id], after[measure.id])
    }
    return resultMap
  }

  return {
    id: 'combined',
    start,
    stop,
    compare,
  }
}
