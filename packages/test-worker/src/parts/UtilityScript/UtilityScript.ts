import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const utiltyScriptPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js')

export const getUtilityScript = async (): Promise<string> => {
  if (!existsSync(utiltyScriptPath)) {
    throw new Error(`utility script not found`)
  }
  const injectedCode = readFileSync(utiltyScriptPath, 'utf-8')
  return injectedCode
}
