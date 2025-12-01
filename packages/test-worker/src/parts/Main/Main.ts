import * as TestWorker from '../TestWorker/TestWorker.ts'

export const main = async () => {
  await TestWorker.listen()
}
