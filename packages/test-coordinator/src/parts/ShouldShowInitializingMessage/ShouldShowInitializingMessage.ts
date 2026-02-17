import * as Ide from '../Ide/Ide.ts'
import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface ShouldShowInitializingMessageOptions {
  readonly arch: string
  readonly commit: string
  readonly ide: string
  readonly insidersCommit: string
  readonly platform: string
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const shouldShowInitializingMessage = async (options: ShouldShowInitializingMessageOptions): Promise<boolean> => {
  const { arch, commit, ide, insidersCommit, platform, vscodePath, vscodeVersion } = options
  if (ide !== Ide.VsCode) {
    return false
  }
  const rpc = await launchInitializationWorker()
  try {
    const cacheKey = insidersCommit || commit
    const isDownloaded = await rpc.invoke('Launch.isVscodeDownloaded', vscodeVersion, vscodePath, cacheKey, platform, arch)
    return !isDownloaded
  } finally {
    await rpc.dispose()
  }
}
