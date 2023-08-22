export const getCwd = () => {
  if (process.env.VSCODE_CWD) {
    return process.env.VSCODE_CWD
  }
  return process.cwd()
}
