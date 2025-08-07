import exitHook from 'exit-hook'
import * as Disposables from '../Disposables/Disposables.js'
import * as Listen from '../Listen/Listen.js'
import { log } from '../Logger/Logger.js'

export const main = async () => {
  log('got main now')
  // TODO maybe use exithook
  exitHook(async () => {
    log('disposing now')
    await Disposables.disposeAll()
  })
  process.on('exit', () => {
    console.log('exiting now')
  })
  process.on('SIGINT', () => {
    console.log('sigint')
  })
  await Listen.listen()
}
