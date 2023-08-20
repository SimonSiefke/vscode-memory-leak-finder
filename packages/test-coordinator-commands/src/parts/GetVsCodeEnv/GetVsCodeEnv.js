export const getVsCodeEnv = ({ extensionsFolder }) => {
  const env = {
    ...process.env,
    VSCODE_EXTENSIONS: extensionsFolder,
  }
  delete env['GIT_ASKPASS']
  delete env['VSCODE_GIT_ASKPASS_MAIN']
  delete env['VSCODE_GIT_ASKPASS_EXTRA_ARGS']
  delete env['VSCODE_GIT_IPC_HANDLE']
  delete env['VSCODE_GIT_ASKPASS_NODE']
  return env
}
