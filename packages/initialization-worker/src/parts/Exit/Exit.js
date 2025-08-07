import * as Disposables from '../Disposables/Disposables.js'

export const exit = async () => {
  await Disposables.disposeAll()
}
