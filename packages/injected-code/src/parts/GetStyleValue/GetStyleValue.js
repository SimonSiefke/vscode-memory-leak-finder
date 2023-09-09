export const getStyleValue = (element, key) => {
  const style = getComputedStyle(element)
  if (key.startsWith('--')) {
    return style.getPropertyValue(key)
  }
  return style[key]
}
