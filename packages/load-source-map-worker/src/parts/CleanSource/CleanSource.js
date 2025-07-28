const RE_VS = /^vs\//

export const cleanSource = (source) => {
  if (!source) {
    return ''
  }
  const vscodeIndex = source.indexOf('vscode')
  if (vscodeIndex !== -1) {
    return source.slice(vscodeIndex + 'vscode'.length + 1)
  }
  return source
    .replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '')
    .replace('file:/Users/cloudtest/vss/_work/1/s/', '')
    .replace(RE_VS, './src/vs/')
    .replace('./src', 'src')
}
