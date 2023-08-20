import * as TestWorker from '../TestWorker/TestWorker.js'

export const main = async () => {
  await TestWorker.listen()
}
