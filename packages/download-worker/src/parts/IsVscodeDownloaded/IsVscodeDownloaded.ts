import * as Env from '../Env/Env.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'

export const isVscodeDownloaded = async (vscodeVersion: string, vscodePath: string, commit: string, platform: string, arch: string): Promise<boolean> => {
  if (vscodePath) {
    return true
  }
  if (commit) {
    return false
  }
  if (Env.env.VSCODE_PATH) {
    return true
  }
  const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(vscodeVersion, platform, arch)
  return cachedPath !== ''
}
