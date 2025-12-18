export const getStyleValue = (element, key) => {
  const style = getComputedStyle(element)
  if (key.startsWith('--')) {
    const rawValue = style.getPropertyValue(key)
    if (typeof rawValue === 'string') {
      return rawValue.trim()
    }
    return rawValue
  }
  return style[key]
}
