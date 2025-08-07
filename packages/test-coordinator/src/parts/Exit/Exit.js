import * as Disposables from '../Disposables/Disposables.js'
import * as ExitCode from '../ExitCode/ExitCode.js'
import * as Process from '../Process/Process.js'

export const exit = async () => {
  await Disposables.disposeAll()
  setTimeout(() => {
    Process.exit(ExitCode.Success)
  }, 0)
}
