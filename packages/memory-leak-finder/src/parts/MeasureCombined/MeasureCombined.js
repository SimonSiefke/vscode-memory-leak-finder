import * as MeasureId from '../MeasureId/MeasureId.js'

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

  const compare = async (before, after) => {
    const resultMap = Object.create(null)
    for (const measure of measures) {
      const comparison = await measure.compare(before[measure.id], after[measure.id])
      resultMap[measure.id] = comparison
      if (measure.isLeak) {
        resultMap.isLeak = measure.isLeak(comparison)
      }
      console.log(measure)
      if (measure.summary) {
        resultMap.summary = measure.summary(comparison)
      }
    }
    return resultMap
  }

  return {
    id: MeasureId.Combined,
    start,
    stop,
    compare,
  }
}
