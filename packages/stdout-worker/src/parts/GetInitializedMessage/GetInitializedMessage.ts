import { formatDuration } from '../FormatDuration/FormatDuration.ts'
import { Initialized } from '../TestPrefix/TestPrefix.ts'

export const getInitializedMessage = async (time: number): Promise<string> => {
  const formattedTime = formatDuration(time)

  const messageFileName = `${Initialized} ${formattedTime}`
  return `${messageFileName}\n`
}
