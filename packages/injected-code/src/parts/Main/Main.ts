import * as TestFrameWork from '../TestFrameWork/TestFrameWork.ipc.ts'

export const main = () => {
  globalThis.test = TestFrameWork.Commands
}
