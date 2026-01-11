import * as LaunchLoadSourceMapsWorker from '../LaunchLoadSourceMapsWorker/LaunchLoadSourceMapsWorker.ts'
import { VError } from '../VError/VError.ts'

export const loadSourceMaps = async (sourceMapUrls: readonly string[]): Promise<void> => {
  try {
    await using rpc = await LaunchLoadSourceMapsWorker.launchLoadSourceMapsWorker()
    await rpc.invoke('LoadSourceMaps.loadSourceMaps', sourceMapUrls)
  } catch (error) {
    throw new VError(error, `Failed to load source maps`)
  }
}
