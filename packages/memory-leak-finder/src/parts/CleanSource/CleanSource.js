export const cleanSource = (source) => {
  if (!source) {
    return ''
  }
  return source.replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '')
}
