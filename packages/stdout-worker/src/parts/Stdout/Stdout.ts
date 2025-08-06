import * as Process from '../Process/Process.ts'

export const write = (data) => {
  Process.stdout.write(data)
}
