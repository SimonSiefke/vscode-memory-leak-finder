import * as TestFrameWork from '../TestFrameWork/TestFrameWork.ipc.ts'
import * as PreventWebviewFocusSteal from '../PreventWebviewFocusSteal/PreventWebviewFocusSteal.ts'

export const main = () => {
  globalThis.test = TestFrameWork.Commands
  
  // Install webview focus prevention to reduce test flakiness
  PreventWebviewFocusSteal.install()
}
