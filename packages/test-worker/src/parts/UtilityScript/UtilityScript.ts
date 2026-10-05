import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Root from '../Root/Root.ts'
import * as RunBuild from '../RunBuild/RunBuild.ts'

const utiltyScriptPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js')
const utilityScriptUrl = pathToFileURL(utiltyScriptPath).toString()

export const getUtilityScript = async (): Promise<string> => {
  if (!existsSync(utiltyScriptPath)) {
    await RunBuild.runBuild()
  }
  const injectedCode = readFileSync(utiltyScriptPath, 'utf-8')
  return `${injectedCode}\n//# sourceURL=${utilityScriptUrl}`
}
