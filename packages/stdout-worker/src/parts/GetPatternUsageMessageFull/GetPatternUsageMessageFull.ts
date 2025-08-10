import * as GetAnsiEscapes from '../GetAnsiEscapes/GetAnsiEscapes.ts'
import * as GetPatternUsageMessage from '../GetPatternUsageMessage/GetPatternUsageMessage.ts'

export const getPatternUsageMessageFull = (): string => {
  const clear = GetAnsiEscapes.getClear()
  const body = GetPatternUsageMessage.getPatternUsageMessage()
  return clear + '\n' + body
}
