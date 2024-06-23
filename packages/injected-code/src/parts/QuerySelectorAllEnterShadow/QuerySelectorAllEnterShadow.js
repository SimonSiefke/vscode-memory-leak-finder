export const querySelectorAll = (roots, body, selector) => {
  if (roots.length === 0) {
    return []
  }
  if (roots.length > 1) {
    throw new Error(`too many matching elements found`)
  }
  const element = roots[0]
  if (!element.shadowRoot) {
    throw new Error('no shadowRoot found')
  }
  const child = element.shadowRoot
  return [child]
}
