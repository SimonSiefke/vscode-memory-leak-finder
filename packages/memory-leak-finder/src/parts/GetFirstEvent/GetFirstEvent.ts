export const getFirstEvent = async (eventEmitter, eventMap) => {
  const { resolve, promise } = Promise.withResolvers<any>()
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
  const { type, event } = await promise
  return { type, event }
}
