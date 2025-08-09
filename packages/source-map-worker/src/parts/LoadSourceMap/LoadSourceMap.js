import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { loadSourceMapWorkerPath } from '../LoadSourceMapWorkerPath/LoadSourceMapWorkerPath.js'
import { VError } from '../VError/VError.js'

export const loadSourceMap = async (url, hash) => {
  try {
    // TODO use `using`
    const rpc = await NodeWorkerRpcParent.create({
      path: loadSourceMapWorkerPath,
      stdio: 'inherit',
      execArgv: [],
      commandMap: {},
    })
    const sourceMap = await rpc.invoke('LoadSourceMap.loadSourceMap', url, hash)
    await rpc.dispose()
    return sourceMap
  } catch (error) {
    throw new VError(error, `Failed to load source map for ${url}`)
  }
}
