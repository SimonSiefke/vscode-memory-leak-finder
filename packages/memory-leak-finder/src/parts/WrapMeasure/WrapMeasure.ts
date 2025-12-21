import type { Session } from '../Session/Session.ts'

export const wrapMeasure = (measure: any) => {
  return {
    id: measure.id,
    create(session: Session) {
      const args = measure.create(session)
      return {
        ...measure,
        targets: measure.targets || [],
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        compare(before, after, context) {
          return measure.compare(before, after, context)
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
