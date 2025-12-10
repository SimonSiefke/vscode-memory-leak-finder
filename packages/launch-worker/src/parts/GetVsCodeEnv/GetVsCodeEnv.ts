export const getVsCodeEnv = async ({ runtimeDir, processEnv, proxyUrl }) => {
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
  if (proxyUrl) {
    env.HTTP_PROXY = proxyUrl
    env.HTTPS_PROXY = proxyUrl
    env.http_proxy = proxyUrl
    env.https_proxy = proxyUrl
    // Don't proxy localhost connections
    env.NO_PROXY = 'localhost,127.0.0.1,0.0.0.0'
    env.no_proxy = 'localhost,127.0.0.1,0.0.0.0'
    console.log(`[GetVsCodeEnv] Set proxy environment variables: HTTP_PROXY=${proxyUrl}`)
  }

  return env
}
