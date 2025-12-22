import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

const loadSourceMapWorkerPath: string = join(Root.root, 'packages', 'load-source-map-worker', 'src', 'loadSourceMapWorkerMain.ts')

const launchLoadSourceMapsWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: loadSourceMapWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method, ...params) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

export const loadSourceMaps = async (sourceMapUrls: readonly string[]): Promise<void> => {
  try {
    await using rpc = await launchLoadSourceMapsWorker()
    await rpc.invoke('LoadSourceMaps.loadSourceMaps', sourceMapUrls)
  } catch (error) {
    throw new VError(error, `Failed to load source maps`)
  }
}
