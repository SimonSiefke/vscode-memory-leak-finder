import { join } from 'path'

export const getVsCodeEnv = ({
  processEnv,
  proxyEnvVars,
  runtimeDir,
  userDataDir,
}: {
  processEnv: NodeJS.ProcessEnv
  runtimeDir?: string
  proxyEnvVars?: any
  userDataDir?: string
}): NodeJS.ProcessEnv => {
  const env = {
    ...processEnv,
  }
  if (runtimeDir) {
    env.XDG_RUNTIME_DIR = runtimeDir
  }
  delete env.GIT_ASKPASS
  delete env.VSCODE_GIT_ASKPASS_MAIN
  delete env.VSCODE_GIT_ASKPASS_EXTRA_ARGS
  delete env.VSCODE_GIT_IPC_HANDLE
  delete env.VSCODE_GIT_ASKPASS_NODE
  delete env.NODE_OPTIONS
  delete env.ELECTRON_RUN_AS_NODE

  if (processEnv.CI || processEnv.GITHUB_ACTIONS) {
    env.COPILOT_DISABLE_KEYTAR = '1'
    if (userDataDir) {
      env.COPILOT_HOME = join(userDataDir, 'copilot-home')
    }
  }

  // Set HTTP_PROXY/HTTPS_PROXY environment variables if proxy is configured
  Object.assign(env, proxyEnvVars)

  return env
}
