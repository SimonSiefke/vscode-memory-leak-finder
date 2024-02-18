export const wrapMeasure = (measure) => {
  return {
    id: measure.id,
    create(session) {
      const args = measure.create(session)
      return {
        ...measure,
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
      }
    },
  }
}
