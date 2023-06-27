import * as GetNewLineIndex from '../GetNewLineIndex/GetNewLineIndex.js'
import * as NormalizeErrorLine from '../NormalizeErrorLine/NormalizeErrorLine.js'

export const mergeStacks = (parent, child) => {
  if (!child) {
    return parent
  }
  const parentNewLineIndex = GetNewLineIndex.getNewLineIndex(parent)
  const childNewLineIndex = GetNewLineIndex.getNewLineIndex(child)
  if (childNewLineIndex === -1) {
    return parent
  }
  const parentFirstLine = parent.slice(0, parentNewLineIndex)
  const childRest = child.slice(childNewLineIndex)
  const childFirstLine = NormalizeErrorLine.normalizeLine(child.slice(0, childNewLineIndex))
  if (parentFirstLine.includes(childFirstLine)) {
    return parentFirstLine + childRest
  }
  return child
}
