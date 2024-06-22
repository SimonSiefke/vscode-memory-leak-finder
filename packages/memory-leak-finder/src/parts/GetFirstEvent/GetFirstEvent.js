import * as Promises from '../Promises/Promises.js'

export const getFirstEvent = async (eventEmitter, eventMap) => {
  const { resolve, promise } = Promises.withResolvers()
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
