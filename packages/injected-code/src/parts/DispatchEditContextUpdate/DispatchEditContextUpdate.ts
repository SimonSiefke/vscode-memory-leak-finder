export const dispatchEditContextUpdate = (element, newValue) => {
  // @ts-ignore
  if (element && element.editContext && typeof TextUpdateEvent !== 'undefined') {
    element.editContext.dispatchEvent(
      // @ts-ignore
      new TextUpdateEvent('textupdate', { selectionEnd: newValue.length, selectionStart: newValue.length, text: newValue }),
    )
  }
}
