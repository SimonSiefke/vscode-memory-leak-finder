import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const getSourceMapWorkerPath = (): string => {
  const thisDir: string = dirname(fileURLToPath(import.meta.url))
  const packageDir: string = resolve(thisDir, '../../..')
  const sourceMapWorkerPath: string = resolve(packageDir, '../source-map-worker/src/sourceMapWorkerMain.ts')
  return sourceMapWorkerPath
}

export const launchSourceMapWorker = async () => {
  const sourceMapWorkerPath: string = getSourceMapWorkerPath()

  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: sourceMapWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: readonly any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
