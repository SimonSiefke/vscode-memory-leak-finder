import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getUtilityScript = (): string => {
  const injectedCode = readFileSync(join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js'), 'utf8')
  return injectedCode
}
