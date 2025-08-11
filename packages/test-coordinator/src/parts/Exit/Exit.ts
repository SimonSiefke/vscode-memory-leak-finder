import * as Disposables from '../Disposables/Disposables.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as Process from '../Process/Process.ts'

export const prepare = async () => {
  await Disposables.disposeAll()
}

export const exit = () => {
  Process.exit(ExitCode.Success)
}
