import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

const loadSourceMapWorkerPath: string = join(Root.root, 'packages', 'load-source-map-worker', 'src', 'loadSourceMapWorkerMain.ts')

export const loadSourceMaps = async (sourceMapUrls: readonly string[]): Promise<void> => {
  try {
    const rpc = await NodeWorkerRpcParent.create({
      path: loadSourceMapWorkerPath,
      stdio: 'inherit',
      execArgv: [],
      commandMap: {},
    })
    await rpc.invoke('LoadSourceMaps.loadSourceMaps', sourceMapUrls)
    await rpc.dispose()
  } catch (error) {
    throw new VError(error, `Failed to load source maps`)
  }
}

