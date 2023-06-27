import * as TestFrameWork from './parts/TestFrameWork/TestFrameWork.ipc.js'

const main = () => {
  globalThis.test = TestFrameWork.Commands
}

main()
