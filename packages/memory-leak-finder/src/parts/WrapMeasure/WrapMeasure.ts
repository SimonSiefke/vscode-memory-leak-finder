import type { Session } from '../Session/Session.ts'

export const wrapMeasure = (measure: any) => {
  return {
    id: measure.id,
    create(session: Session, context: any) {
      const args = measure.create(session, context)
      return {
        ...measure,
        targets: measure.targets || [],
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
