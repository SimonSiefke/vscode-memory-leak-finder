export const mergeStacks = (parentStack: string | undefined, childStack: string | undefined): string | undefined => {
  if (!childStack) {
    return parentStack
  }
  if (!parentStack) {
    return childStack
  }
  const parentLines = parentStack.split('\n')
  const childLines = childStack.split('\n')
  const mergedLines = [parentLines[0], ...childLines, ...parentLines.slice(1)]
  return mergedLines.join('\n')
}
