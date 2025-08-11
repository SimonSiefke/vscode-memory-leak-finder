import * as Disposables from '../Disposables/Disposables.js'
import * as ExitCode from '../ExitCode/ExitCode.js'
import * as Process from '../Process/Process.js'

export const prepare = async () => {
  await Disposables.disposeAll()
}

export const exit = () => {
  Process.exit(ExitCode.Success)
}
