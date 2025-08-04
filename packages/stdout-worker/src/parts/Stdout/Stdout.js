import * as Process from '../Process/Process.js'

export const write = (data) => {
  Process.stdout.write(data)
}
