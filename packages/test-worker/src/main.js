import * as TestWorker from './parts/TestWorker/TestWorker.js'

const main = async () => {
  await TestWorker.listen()
}

main()
