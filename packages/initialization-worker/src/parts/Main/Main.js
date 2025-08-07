import { parentPort } from 'node:worker_threads'
import * as Listen from '../Listen/Listen.js'
import * as Disposables from '../Disposables/Disposables.js'

export const main = async () => {
  // TODO maybe use exithook
  process.on('exit', async () => {
    console.log('exiting')
    await Disposables.disposeAll()
  })
  process.on('disconnect', async () => {
    await Disposables.disposeAll()
    console.log('disocnnect')
  })
  parentPort.on('close', async () => {
    await Disposables.disposeAll()
    console.log('parent gone')
  })
  await Listen.listen()
}
