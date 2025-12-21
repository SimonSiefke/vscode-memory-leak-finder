import * as EncodingType from '../EncodingType/EncodingType.ts'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.ts'
import * as Stdin from '../Stdin/Stdin.ts'

export const start = async (): Promise<void> => {
  await Stdin.setRawMode(true)
  await Stdin.resume()
  await Stdin.setEncoding(EncodingType.Utf8)
  Stdin.on('data', HandleStdinData.handleStdinData)
}
