import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
export const wrapMeasure = (measure: Dynamic) => {
  return {
    create(session: Session) {
      const args = measure.create(session)
      return {
        ...measure,
        compare(before: Dynamic, after: Dynamic, context: Dynamic) {
          return measure.compare(before, after, context, ...args)
        },
        async releaseResources() {
          if (measure.releaseResources) {
            await measure.releaseResources(...args)
          }
        },
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        targets: measure.targets || [],
      }
    },
    id: measure.id,
  }
}
