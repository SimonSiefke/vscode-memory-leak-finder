import { readFile } from 'fs/promises'
import { join } from 'path'
import * as Assert from '../Assert/Assert.js'
import * as Root from '../Root/Root.js'
import * as SourceMap from '../SourceMap/SourceMap.js'

export const getInjectedCodeOriginalPosition = async (line, column) => {
  Assert.number(line)
  Assert.number(column)
  const rawSourceMapPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js.map')
  const rawSourceMapString = await readFile(rawSourceMapPath, 'utf8')
  const rawSourceMap = JSON.parse(rawSourceMapString)
  const originalPosition = await SourceMap.getOriginalPosition(rawSourceMap, line, column)
  return originalPosition
}
