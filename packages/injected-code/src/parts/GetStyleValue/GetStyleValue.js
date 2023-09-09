export const getStyleValue = (style, key) => {
  if (key.startsWith('--')) {
    return style.getPropertyValue(key)
  }
  return style[key]
}
