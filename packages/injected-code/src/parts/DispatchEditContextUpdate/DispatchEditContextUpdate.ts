export const dispatchEditContextUpdate = (element, newValue) => {
  // @ts-ignore
  if (element && element.editContext && typeof TextUpdateEvent !== 'undefined') {
    element.editContext.dispatchEvent(
      // @ts-ignore
      new TextUpdateEvent('textupdate', { text: newValue, selectionStart: newValue.length, selectionEnd: newValue.length }),
    )
  }
}
