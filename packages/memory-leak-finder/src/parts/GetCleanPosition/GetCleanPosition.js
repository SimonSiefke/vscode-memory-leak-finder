const cleanSource = (source) => {
  if (!source) {
    return ''
  }
  return source.replace('out-vscode/vs/workbench/file:/mnt/vss/_work/1/s', '')
}

export const getCleanPosition = (position) => {
  if (!position) {
    return undefined
  }
  const { source } = position
  return {
    ...position,
    source: cleanSource(source),
  }
}
