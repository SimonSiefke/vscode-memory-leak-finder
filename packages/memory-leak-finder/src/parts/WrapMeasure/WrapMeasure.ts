import type { Session } from '../Session/Session.ts'

export const wrapMeasure = (measure: any) => {
  return {
    create(session: Session) {
      const args = measure.create(session)
      return {
        args,
        ...measure,
        compare(before, after, context) {
          return measure.compare(before, after, context)
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
