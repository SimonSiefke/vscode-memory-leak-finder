import * as MeasureId from '../MeasureId/MeasureId.ts'

// TODO for large data and multiple measures, it might be bad to store much data in memory
// better to store before and after data on disk, and when comparing, read it from disk
// comparison could also happen in another worker
export const combine = (...measures) => {
  const subMeasures = Object.create(null)

  const start = async (workerSessions) => {
    const beforeMap = Object.create(null)
    for (const measure of measures) {
      console.log({ measure, workerSessions })
      beforeMap[measure.id] = await measure.start()

      for (const workerSession of workerSessions) {
        const subMeasure = measure.create(workerSession)
        console.log({ measure, subMeasure })
        const beforeSub = await subMeasure.start(subMeasure.rpc)
        subMeasures[workerSession.sessionId] = subMeasure
        beforeMap[measure.id + '/' + workerSession.sessionId] = beforeSub
      }
    }
    return beforeMap
  }

  const stop = async (workerSessions) => {
    const afterMap = Object.create(null)
    for (const measure of measures) {
      afterMap[measure.id] = await measure.stop()

      for (const workerSession of workerSessions) {
        const subMeasure = subMeasures[workerSession.sessionId]
        const afterSub = await subMeasure.stop(subMeasure, subMeasure.rpc)
        afterMap[measure.id + '/' + workerSession.sessionId] = afterSub
      }
    }

    return afterMap
  }

<<<<<<< HEAD:packages/memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.js
  const compare = async (before, after) => {
    console.log({ before, after })
=======
  const compare = async (before, after, context) => {
>>>>>>> origin/main:packages/memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.ts
    const resultMap = Object.create(null)
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
<<<<<<< HEAD
<<<<<<< HEAD
    measures,
=======
    compare,
>>>>>>> 754f9c7c3911 (feature: sort memory leak finder (#2295))
=======
    compare,
>>>>>>> origin/main
    id: MeasureId.Combined,
    releaseResources,
    start,
    stop,
  }
}
