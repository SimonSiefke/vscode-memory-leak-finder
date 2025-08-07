import * as Character from '../Character/Character.ts'
import * as EncodingType from '../EncodingType/EncodingType.ts'
import * as Stdin from '../Stdin/Stdin.ts'
import * as Stdout from '../Stdout/Stdout.ts'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.ts'

export const start = async () => {
  await Stdin.setRawMode(true)
  await Stdin.resume()
  await Stdin.setEncoding(EncodingType.Utf8)
  Stdin.on('data', HandleStdinData.handleStdinData)
}

export const stop = async () => {
  // TODO use worker for stdin
  await Stdin.pause()
  await Stdout.write(Character.NewLine)
}
