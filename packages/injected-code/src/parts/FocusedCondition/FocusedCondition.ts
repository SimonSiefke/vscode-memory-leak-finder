export const toBeFocused = (element, { descendantSelector = '' } = {}) => {
  const activeElement = document.activeElement
  if (descendantSelector) {
    return activeElement !== element && element.contains(activeElement) && Boolean(activeElement?.matches(descendantSelector))
  }
  return element === activeElement
}
