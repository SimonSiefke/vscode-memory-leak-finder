export const isPausedOnStartEvent = (event) => {
  return event && event.params && event.params.reason === 'Break on start'
}
