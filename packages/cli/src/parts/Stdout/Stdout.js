import { string } from '@lvce-editor/assert'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const write = async (data) => {
  string(data)
  process.stdout.write(data)
  // await StdoutWorker.invoke('Stdout.write', data)

  // process.stdout.write('\n')
  // await new Promise((r) => {
  //   setTimeout(r, 100)
  // })
  // process.stdout.on('drain', () => {
  //   console.log('did drain now')
  // })
  // await new Promise((r) => {
  // setTimeout(r, 1)
  // })
  // console.log('did write')
  // console.log({ data })
}
