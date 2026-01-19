export const getStyleValue = (element: Element, key: string): string | undefined => {
  const style = getComputedStyle(element)
  if (key.startsWith('--')) {
    const rawValue = style.getPropertyValue(key)
    if (typeof rawValue === 'string') {
      return rawValue.trim()
    }
    return rawValue
  }
  return (style as unknown as { [key: string]: string | undefined })[key]
}
