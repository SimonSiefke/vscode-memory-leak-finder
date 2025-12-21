import * as FormatAsSeconds from '../FormatAsSeconds/FormatAsSeconds.ts'

export const formatDuration = (duration: number): string => {
  return `(${FormatAsSeconds.formatAsSeconds(duration)})`
}
