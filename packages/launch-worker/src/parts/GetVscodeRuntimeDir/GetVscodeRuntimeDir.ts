import * as Env from '../Env/Env.ts'
import { join } from '../Path/Path.ts'
import * as Root from '../Root/Root.ts'

export const getVscodeRuntimeDir = () => {
  if (Env.env.GITPOD_INSTANCE_ID) {
    // Gitpod doesn't support custom runtime dir
    return ''
  }
  const runtimeDir = join(Root.root, '.vscode-runtime-dir')
  // vscode doesn't allow a socket file that is longer than 107 characters
  // the socket file is ~30 characters longer than runtimeDir
  if (runtimeDir.length > 70) {
    return ''
  }
  return runtimeDir
}
