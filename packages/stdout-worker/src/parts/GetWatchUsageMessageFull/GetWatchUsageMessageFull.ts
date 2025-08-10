import * as GetAnsiEscapes from '../GetAnsiEscapes/GetAnsiEscapes.ts'
import * as GetWatchUsageMessage from '../GetWatchUsageMessage/GetWatchUsageMessage.ts'

export const getWatchUsageMessageFull = (): string => {
  const clear = GetAnsiEscapes.getClear()
  const body = GetWatchUsageMessage.getWatchUsageMessage()
  return clear + '\n' + body
}
