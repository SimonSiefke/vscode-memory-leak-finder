export const getVsCodeEnv = ({ extensionsFolder, runtimeDir, processEnv }) => {
  const env = {
    ...processEnv,
    VSCODE_EXTENSIONS: extensionsFolder,
  }
  if (runtimeDir) {
    env['XDG_RUNTIME_DIR'] = runtimeDir
  }
  delete env['GIT_ASKPASS']
  delete env['VSCODE_GIT_ASKPASS_MAIN']
  delete env['VSCODE_GIT_ASKPASS_EXTRA_ARGS']
  delete env['VSCODE_GIT_IPC_HANDLE']
  delete env['VSCODE_GIT_ASKPASS_NODE']
  delete env['NODE_OPTIONS']
  return env
}
