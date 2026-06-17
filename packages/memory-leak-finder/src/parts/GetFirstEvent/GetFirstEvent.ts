import type { Dynamic } from '../Types/Types.ts'
export const getFirstEvent = async (eventEmitter: Dynamic, eventMap: Dynamic) => {
  const { promise, resolve } = Promise.withResolvers<Dynamic>()
  const listenerMap = Object.create(null)
  const cleanup = (value: Dynamic) => {
    for (const event of Object.keys(eventMap)) {
      eventEmitter.off(event, listenerMap[event])
    }
    resolve(value)
  }
  for (const [event, type] of Object.entries(eventMap)) {
    const listener = (event: Dynamic) => {
      cleanup({
        event,
        type,
      })
    }
    eventEmitter.on(event, listener)
    listenerMap[event] = listener
  }
  const { event, type } = await promise
  return { event, type }
}
