import { join } from 'path'
import * as SourceMap from '../SourceMap/SourceMap.js'
import * as Root from '../Root/Root.js'
import { readFile } from 'fs/promises'
import * as Assert from '../Assert/Assert.js'

export const getInjectedCodeOriginalPosition = (line, column) => {
  Assert.number(line)
  Assert.number(column)
  const rawSourceMapPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js.map')
  const rawSourceMap = readFile(rawSourceMapPath, 'utf8')
  SourceMap.getOriginalPosition(rawSourceMap, line, column)
}
