import * as Disposables from '../Disposables/Disposables.js'
import * as ExitCode from '../ExitCode/ExitCode.js'
import * as Process from '../Process/Process.js'
import * as Time from '../Time/Time.js'

export const exit = async () => {
  const s = Time.now()
  await Disposables.disposeAll()
  const e = Time.now()
  console.log(`finished worker cleanup in ${e - s}ms`)
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  console.log(`worker uses approximately ${Math.round(used * 100) / 100} MB`)
  setTimeout(() => {
    Process.exit(ExitCode.Success)
  }, 0)
}
