import * as Env from '../Env/Env.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'

export const isVscodeDownloaded = async (
  vscodeVersion: string,
  vscodePath: string,
  commit: string,
  platform: string,
  arch: string,
): Promise<boolean> => {
  if (vscodePath) {
    return true
  }
  if (Env.env.VSCODE_PATH) {
    return true
  }
  const cacheKey = commit || vscodeVersion
  if (!cacheKey) {
    return false
  }
  const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(cacheKey, platform, arch)
  return cachedPath !== ''
}
