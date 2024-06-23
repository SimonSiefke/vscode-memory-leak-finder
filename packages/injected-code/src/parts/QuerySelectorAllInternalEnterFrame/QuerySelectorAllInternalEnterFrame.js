export const querySelectorAll = (roots, body, selector) => {
  if (roots.length === 0) {
    return []
  }
  if (roots.length > 1) {
    throw new Error(`too many matching iframe elements found`)
  }
  const element = roots[0]
  if (element.nodeName !== 'IFRAME') {
    throw new Error('node is not of type iframe')
  }
  const contentDocument = element.contentDocument
  return [contentDocument]
}
