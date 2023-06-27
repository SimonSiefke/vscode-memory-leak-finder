import * as EncodingType from '../EncodingType/EncodingType.js'
import * as HandleStdinData from '../HandleStdinData/HandleStdinData.js'
import * as Stdin from '../Stdin/Stdin.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as WatchUsage from '../WatchUsage/WatchUsage.js'

export const run = () => {
  Stdin.setRawMode(true)
  Stdin.resume()
  Stdin.setEncoding(EncodingType.Utf8)
  Stdin.on('data', HandleStdinData.handleStdinData)
  Stdout.write(WatchUsage.print())
}
