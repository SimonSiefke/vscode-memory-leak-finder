import { dirname } from 'node:path'
import * as ParseLineAndColumn from '../ParseLineAndColumn/ParseLineAndColumn.js'

const emptySourceMapUrl = {
  sourceMapUrl: '',
  line: 0,
  column: 0,
}

const isRelativeSourceMap = (sourceMapUrl) => {
  if (sourceMapUrl.startsWith('file://')) {
    return false
  }
  if (sourceMapUrl.startsWith('data:')) {
    return false
  }
  if (sourceMapUrl.startsWith('http://')) {
    return false
  }
  if (sourceMapUrl.startsWith('https://')) {
    return false
  }
  return true
}

const RE_LINE_COLUMN = /(\d+):(\d+)/
const RE_PATH = /\((.+)\:\d+\:\d+\)$/

export const getSourceMapUrl = (eventListener) => {
  const { stack, sourceMaps } = eventListener
  if (!stack || !sourceMaps) {
    return emptySourceMapUrl
  }
  const firstStackLine = stack[0]
  const parsed = ParseLineAndColumn.parseLineAndColumn(firstStackLine)
  if (!parsed) {
    return emptySourceMapUrl
  }
  let sourceMapUrl = sourceMaps[0] || ''
  if (sourceMapUrl && isRelativeSourceMap(sourceMapUrl)) {
    const pathMatch = firstStackLine.match(RE_PATH, '')
    if (pathMatch) {
      const path = pathMatch[1]
      sourceMapUrl = dirname(path) + '/' + sourceMapUrl
    }
    console.log({ sourceMapUrl, pathMatch, firstStackLine })
  }

  return {
    sourceMapUrl,
    line: parsed.line,
    column: parsed.column,
  }
}
