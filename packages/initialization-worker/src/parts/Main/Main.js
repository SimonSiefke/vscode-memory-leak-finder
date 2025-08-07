import { parentPort } from 'node:worker_threads'
import * as Listen from '../Listen/Listen.js'
import * as Disposables from '../Disposables/Disposables.js'

export const main = async () => {
  process.on('exit', async () => {
    console.log('exiting')
    await Disposables.disposeAll()
  })
  process.on('disconnect', () => {
    console.log('disocnnect')
  })
  parentPort.on('close', () => {
    console.log('parent gone')
  })
  await Listen.listen()
}
