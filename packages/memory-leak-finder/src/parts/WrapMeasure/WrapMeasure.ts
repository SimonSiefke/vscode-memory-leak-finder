import { getDefaultTarget } from '../MeasureTargetDefaults/MeasureTargetDefaults.ts'

export const wrapMeasure = (measure) => {
  return {
    id: measure.id,
    create(session) {
      const args = measure.create(session)
      return {
        ...measure,
        targets:
          Array.isArray(measure.targets) && measure.targets.length > 0
            ? measure.targets
            : (Array.isArray(measure.target) && measure.target.length > 0
              ? measure.target
              : getDefaultTarget(measure.id)),
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        async releaseResources() {
          if (measure.releaseResources) {
            await measure.releaseResources(...args)
          }
        },
      }
    },
  }
}
