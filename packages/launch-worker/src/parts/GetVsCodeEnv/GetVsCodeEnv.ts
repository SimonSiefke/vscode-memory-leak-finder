export const getVsCodeEnv = ({
  processEnv,
  proxyEnvVars,
  runtimeDir,
}: {
  processEnv: NodeJS.ProcessEnv
  runtimeDir?: string
  proxyEnvVars?: any
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

  // Set HTTP_PROXY/HTTPS_PROXY environment variables if proxy is configured
  Object.assign(env, proxyEnvVars)

  return env
}
