export const isLeakDomCounters = ({ after, before }) => {
  return after.documents > before.documents || after.nodes > before.nodes || after.jsEventListeners > before.jsEventListeners
}
