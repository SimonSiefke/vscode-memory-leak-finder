export const dispatchEditContextUpdate = (element, newValue) => {
  // @ts-ignore
  if (element && element.editContext && typeof TextUpdateEvent !== 'undefined') {
    // @ts-ignore
    element.editContext.dispatchEvent(new TextUpdateEvent('textupdate', { text: newValue }))
  }
}
