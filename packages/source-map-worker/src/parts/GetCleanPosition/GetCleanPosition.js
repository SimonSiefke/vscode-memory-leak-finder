import * as CleanSource from '../CleanSource/CleanSource.js'

export const getCleanPosition = (position) => {
  if (!position) {
    return undefined
  }
  const { source } = position
  return {
    ...position,
    source: CleanSource.cleanSource(source),
  }
}
