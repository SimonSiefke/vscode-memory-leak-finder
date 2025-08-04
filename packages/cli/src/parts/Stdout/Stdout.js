import * as Process from '../Process/Process.js'

export const write = async (data) => {
  // TODO use worker for stdout
  Process.stdout.write(data)
}
