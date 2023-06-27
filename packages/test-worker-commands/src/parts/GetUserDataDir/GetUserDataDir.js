import * as TmpDir from '../TmpDir/TmpDir.js'

export const getUserDataDir = () => {
  return TmpDir.create()
}
