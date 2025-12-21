export const getDomNodeHash = (domNode) => {
  return `${domNode.className}-${domNode.description}`
}
