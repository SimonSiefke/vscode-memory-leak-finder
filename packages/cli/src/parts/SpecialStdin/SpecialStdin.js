import * as Character from '../Character/Character.js'
import * as EncodingType from '../EncodingType/EncodingType.js'
import * as Stdin from '../Stdin/Stdin.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.js'

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
