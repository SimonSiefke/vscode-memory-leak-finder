import * as Character from '../Character/Character.ts'
import * as EncodingType from '../EncodingType/EncodingType.ts'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.ts'
import * as Stdin from '../Stdin/Stdin.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const start = async () => {
  Stdin.setRawMode(true)
  Stdin.resume()
  Stdin.setEncoding(EncodingType.Utf8)
  Stdin.on('data', HandleStdinData.handleStdinData)
}

export const stop = async () => {
  Stdin.pause()
  Stdout.write(Character.NewLine)
}
