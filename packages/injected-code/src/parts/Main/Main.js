import * as TestFrameWork from '../TestFrameWork/TestFrameWork.ipc.js'

export const main = () => {
  globalThis.test = TestFrameWork.Commands
}
