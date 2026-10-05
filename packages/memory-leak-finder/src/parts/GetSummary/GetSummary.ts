import type { Dynamic } from '../Types/Types.ts'
export const getSummary = (result: Dynamic) => {
  if (result && result.eventListeners) {
    return { eventListeners: result.eventListeners }
  }
  if (result && result.summary) {
    return result.summary
  }
  return { result }
}
