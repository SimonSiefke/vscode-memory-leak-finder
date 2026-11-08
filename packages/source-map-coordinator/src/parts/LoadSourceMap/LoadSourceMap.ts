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
    invoke(method: string, ...params: any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

export const createSourceMapLoader = async () => {
  const rpc = await launchLoadSourceMapWorker()
  return {
    async loadSourceMap(url: string, hash: string): Promise<any> {
      try {
        return await rpc.invoke('LoadSourceMap.loadSourceMap', url, hash)
      } catch (error) {
        throw new VError(error, `Failed to load source map for ${url}`)
      }
    },
    async [Symbol.asyncDispose]() {
      await rpc[Symbol.asyncDispose]()
    },
  }
}
