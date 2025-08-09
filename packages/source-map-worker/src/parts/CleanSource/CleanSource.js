export const cleanSource = (source: string | undefined): string => {
  if (!source) {
    return ''
  }
  return source.replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '').replace('file:/Users/cloudtest/vss/_work/1/s/', '')
}
