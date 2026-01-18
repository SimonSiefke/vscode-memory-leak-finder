export const querySelectorAll = (roots: readonly Element[], body: string, selector: string): Element[] => {
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
  const child = element.shadowRoot as unknown as Element
  return [child]
}
