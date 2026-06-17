export const querySelectorAll = (roots: readonly Element[], body: string, selector: string): Element[] => {
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
  const iframeElement = element as HTMLIFrameElement
  const contentDocument = iframeElement.contentDocument
  if (!contentDocument) {
    return []
  }
  return [contentDocument as unknown as Element]
}
