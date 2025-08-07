import exitHook from 'exit-hook'
import * as Disposables from '../Disposables/Disposables.js'
import * as Listen from '../Listen/Listen.js'

export const main = async () => {
  // TODO maybe use exithook
  exitHook(async () => {
    await Disposables.disposeAll()
  })
  await Listen.listen()
}
