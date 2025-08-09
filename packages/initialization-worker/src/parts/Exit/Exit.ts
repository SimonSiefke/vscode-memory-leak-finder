import * as Disposables from '../Disposables/Disposables.ts'

export const exit = async () => {
  await Disposables.disposeAll()
}
