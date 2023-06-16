export const getEventListenerKey = (listener) => {
  return `${listener.lineNumber}:${listener.columnNumber}`
}
