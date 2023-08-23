import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as Process from '../Process/Process.js'
import * as Time from '../Time/Time.js'

export const exit = () => {
  const s = Time.now()
  LaunchElectron.cleanup()
  const e = Time.now()
  // process.exit(0)
  console.log(`finished worker cleanup in ${e - s}ms`)
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  console.log(`worker uses approximately ${Math.round(used * 100) / 100} MB`)
  setTimeout(() => {
    Process.exit(0)
  }, 0)
  // console.log(process._activeHandles)

  // console.log({
  //   handles: process._getActiveHandles(),
  //   requests: process._getActiveRequests(),
  // })
}
