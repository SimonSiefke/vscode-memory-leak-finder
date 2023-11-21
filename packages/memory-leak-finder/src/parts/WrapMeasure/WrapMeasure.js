export const wrapMeasure = (measure) => {
  return {
    create(session, scriptMap) {
      const args = measure.create(session, scriptMap)
      return {
        id: measure.id,
        start() {
          return measure.start(...args)
        },
        stop() {
          return measure.stop(...args)
        },
        compare: measure.compare,
        isLeak: measure.isLeak,
      }
    },
  }
}
