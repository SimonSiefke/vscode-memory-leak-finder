import * as LaunchInitializationWorker from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareTrackedVscodeOptions {
  readonly arch: string
  readonly buildVscodeMinified: boolean
  readonly commit: string
  readonly insidersCommit: string
  readonly measureId: string
  readonly platform: string
  readonly updateUrl: string
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareTrackedVscode = async (options: PrepareTrackedVscodeOptions): Promise<string> => {
  const rpc = await LaunchInitializationWorker.launchInitializationWorker()
  try {
    return await rpc.invoke('Launch.prepareTrackedVscode', options)
  } finally {
    await rpc.dispose()
  }
}
