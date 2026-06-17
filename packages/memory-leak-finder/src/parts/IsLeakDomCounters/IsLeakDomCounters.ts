import type { Dynamic } from '../Types/Types.ts'
export const isLeakDomCounters = ({ after, before }: Dynamic) => {
  return after.documents > before.documents || after.nodes > before.nodes || after.jsEventListeners > before.jsEventListeners
}
