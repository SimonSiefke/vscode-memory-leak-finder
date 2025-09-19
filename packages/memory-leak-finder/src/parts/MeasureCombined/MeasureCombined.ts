import * as MeasureId from '../MeasureId/MeasureId.ts'

// TODO for large data and multiple measures, it might be bad to store much data in memory
// better to store before and after data on disk, and when comparing, read it from disk
// comparison could also happen in another worker
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

  const compare = async (before, after, context) => {
    const resultMap = Object.create(null)
    console.log({ before, after, context })
    for (const measure of measures) {
      const comparison = await measure.compare(before[measure.id], after[measure.id], context)
      resultMap[measure.id] = comparison
      if (measure.isLeak) {
        resultMap.isLeak = measure.isLeak(comparison)
      }
      if (measure.summary) {
        resultMap.summary = measure.summary(comparison)
      }
    }
    return resultMap
  }

  const releaseResources = async () => {
    for (const measure of measures) {
      await measure.releaseResources()
    }
  }

  return {
    id: MeasureId.Combined,
    start,
    stop,
    compare,
    releaseResources,
  }
}
