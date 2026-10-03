const cleanRelativePath = (source: string): string => {
  let clean = source.replaceAll('\\', '/')
  clean = clean.replace(/^[a-zA-Z]:\/+/, '')
  clean = clean.replace(/^\/+/, '')
  while (clean.startsWith('../') || clean.startsWith('./')) {
    clean = clean.replace(/^(\.\.\/|\.\/)+/, '')
  }
  while (clean.includes('/../') || clean.includes('/./')) {
    clean = clean.replaceAll('/../', '/')
    clean = clean.replaceAll('/./', '/')
  }
  clean = clean.replace(/\/\.\.$/, '')
  clean = clean.replace(/\/\.$/, '')
  return clean
}

export const cleanSource = (source: string | undefined | null): string => {
  if (!source) {
    return ''
  }
  const cleaned = source.replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '').replace('file:/Users/cloudtest/vss/_work/1/s/', '')
  return cleanRelativePath(cleaned)
}
