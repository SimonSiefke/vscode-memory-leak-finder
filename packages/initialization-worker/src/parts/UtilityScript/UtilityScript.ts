import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import * as LaunchFileSystemWorker from '../LaunchFileSystemWorker/LaunchFileSystemWorker.ts'

const utiltyScriptPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js')

const runBuild = async () => {
  const rpc = await LaunchFileSystemWorker.launchFileSystemWorker()
  await rpc.invoke('FileSystem.exec', `npm`, ['run', 'build'], {
    cwd: Root.root,
  })
  await rpc.dispose()
}

export const getUtilityScript = async (): Promise<string> => {
  if (!existsSync(utiltyScriptPath)) {
    await runBuild()
  }
  const injectedCode = readFileSync(utiltyScriptPath, 'utf-8')
  return injectedCode
}
