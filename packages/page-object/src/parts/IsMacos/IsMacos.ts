import * as PlatformState from '../PlatformState/PlatformState.ts'

export const isMacos = (): boolean => {
  const platform = PlatformState.getPlatform()
  return platform === 'darwin'
}
