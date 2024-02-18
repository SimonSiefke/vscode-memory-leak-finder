export const isLeakDomCounters = ({ before, after }) => {
  return after.documents > before.documents || after.nodes > before.nodes || after.jsEventListeners > before.jsEventListeners
}
