import type { Dynamic } from '../Types/Types.ts'
export const getEventListenersFromMap = (listenerMap: Dynamic) => {
  return listenerMap.listeners
}
