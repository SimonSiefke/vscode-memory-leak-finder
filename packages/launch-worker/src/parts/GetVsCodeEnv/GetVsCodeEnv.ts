<<<<<<< HEAD
export const getVsCodeEnv = ({ runtimeDir, processEnv, proxyEnvVars }) => {
=======
export const getVsCodeEnv = ({ processEnv, runtimeDir }: { processEnv: NodeJS.ProcessEnv; runtimeDir?: string }): NodeJS.ProcessEnv => {
>>>>>>> origin/main
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

  // Set HTTP_PROXY/HTTPS_PROXY environment variables if proxy is configured
  Object.assign(env, proxyEnvVars)

  return env
}
