import type { Dynamic } from '../Types/Types.ts'
import { dirname, sep } from 'node:path'
import * as ParseLineAndColumn from '../ParseLineAndColumn/ParseLineAndColumn.ts'
const emptySourceMapUrl = {
  column: 0,
  line: 0,
  sourceMapUrl: '',
}
const isRelativeSourceMap = (sourceMapUrl: Dynamic) => {
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
const RE_PATH = /\((.+):\d+:\d+\)$/
const isUrl = (path: string) => {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')
}

const resolveRelativeSourceMap = (sourceMapUrl: Dynamic, stackLine: Dynamic) => {
  const pathMatch = stackLine.match(RE_PATH, '')
  if (!pathMatch) {
    return sourceMapUrl
  }
  const path = pathMatch[1]
  if (isUrl(path)) {
    return new URL(sourceMapUrl, path).toString()
  }
  return dirname(path) + sep + sourceMapUrl
}

export const getSourceMapUrl = (eventListener: Dynamic) => {
  const { sourceMaps, stack } = eventListener
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
    sourceMapUrl = resolveRelativeSourceMap(sourceMapUrl, firstStackLine)
  }
  return {
    column: parsed.column,
    line: parsed.line,
    sourceMapUrl,
  }
}
