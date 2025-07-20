export const getFirstEvent = async (eventEmitter, eventMap) => {
  const { type, event } = await new Promise((resolve, reject) => {
    const listenerMap = Object.create(null)
    const cleanup = (value) => {
      for (const event of Object.keys(eventMap)) {
        eventEmitter.off(event, listenerMap[event])
      }
      resolve(value)
    }
    for (const [event, type] of Object.entries(eventMap)) {
      const listener = (event) => {
        cleanup({
          type,
          event,
        })
      }
      eventEmitter.on(event, listener)
      listenerMap[event] = listener
    }
  })
  return { type, event }
}
