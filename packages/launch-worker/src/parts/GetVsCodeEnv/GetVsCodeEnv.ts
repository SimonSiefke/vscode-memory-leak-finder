export const getVsCodeEnv = async ({ runtimeDir, processEnv }) => {
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

  // Check for proxy state file and set HTTP_PROXY/HTTPS_PROXY if proxy is configured
  try {
    const { readFile } = await import('fs/promises')
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const { dirname } = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const root = join(__dirname, '..', '..', '..', '..', '..')
    const proxyStateFile = join(root, '.vscode-proxy-state.json')

    if (existsSync(proxyStateFile)) {
      const content = await readFile(proxyStateFile, 'utf8')
      const proxyState = JSON.parse(content)
      if (proxyState.proxyUrl) {
        env.HTTP_PROXY = proxyState.proxyUrl
        env.HTTPS_PROXY = proxyState.proxyUrl
        env.http_proxy = proxyState.proxyUrl
        env.https_proxy = proxyState.proxyUrl
      }
    }
  } catch (error) {
    // Ignore errors reading proxy state
  }

  return env
}
