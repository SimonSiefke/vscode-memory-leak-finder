export const wrapMeasure = (measure) => {
  return {
    create(session) {
      const args = measure.create(session)
      return {
        id: measure.id,
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        compare(before, after) {
          return measure.compare(before, after)
        },
      }
    },
  }
}
