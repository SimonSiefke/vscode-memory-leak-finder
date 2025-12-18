export const mergeStacks = (parentStack, childStack) => {
  if (!childStack) {
    return parentStack
  }
  const parentLines = parentStack.split('\n')
  const childLines = childStack.split('\n')
  const mergedLines = [parentLines[0], ...childLines, ...parentLines.slice(1)]
  return mergedLines.join('\n')
}
