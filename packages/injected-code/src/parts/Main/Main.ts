import * as TestFrameWork from '../TestFrameWork/TestFrameWork.ipc.ts'

export const main = (): void => {
  ;(globalThis as { test?: unknown }).test = TestFrameWork.Commands
}
