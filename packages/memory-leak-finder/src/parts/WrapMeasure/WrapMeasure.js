export const wrapMeasure = (measure) => {
  return {
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
