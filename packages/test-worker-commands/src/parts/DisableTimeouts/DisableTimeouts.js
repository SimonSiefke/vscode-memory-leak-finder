import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const disableTimeouts = async (firstWindow) => {
  await DevtoolsProtocolRuntime.evaluate(firstWindow.rpc, {
    expression: `(() => {
  if(globalThis.____timeoutMocked){
    return
  }
  globalThis.____timeoutMocked = true
  const originalSetTimeout = globalThis.vscodeOriginalSetTimeout || globalThis.setTimeout
  globalThis.setTimeout = (fn, delay) => {
    return originalSetTimeout(fn, 0)
  }
})()`,
  })
}
