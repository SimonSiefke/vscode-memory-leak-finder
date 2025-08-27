import { getDefaultTarget } from '../MeasureTargetDefaults/MeasureTargetDefaults.ts'

export const wrapMeasure = (measure) => {
  return {
    id: measure.id,
    create(session, context?) {
      const args = measure.create(session, context)
      return {
        ...measure,
        targets:
          Array.isArray(measure.targets) && measure.targets.length > 0
            ? measure.targets
            : Array.isArray(measure.target) && measure.target.length > 0
              ? measure.target
              : getDefaultTarget(measure.id),
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        compare(before, after) {
          return measure.compare(before, after, ...args)
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
