import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { loadSourceMapWorkerPath } from '../LoadSourceMapWorkerPath/LoadSourceMapWorkerPath.ts'
import { VError } from '../VError/VError.ts'

const launchLoadSourceMapWorker = async () => {
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

export const loadSourceMap = async (url: string, hash: string): Promise<any> => {
  try {
    await using rpc = await launchLoadSourceMapWorker()
    const sourceMap = await rpc.invoke('LoadSourceMap.loadSourceMap', url, hash)
    return sourceMap
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
