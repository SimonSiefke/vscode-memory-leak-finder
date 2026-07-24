import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const startTrackingTimeouts = async (session: Session, objectGroup: string) => {
  // object group is required for function preview to work
  // see https://github.com/puppeteer/puppeteer/issues/3349#issuecomment-548428762

  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___timeouts = 0
globalThis.___knownIds = Object.create(null)

globalThis.___originalSetTimeout = globalThis.setTimeout.bind(globalThis)
globalThis.___originalClearTimeout = globalThis.clearTimeout.bind(globalThis)
globalThis.setTimeout = (fn, timeout, ...args) => {
  globalThis.___timeouts++
  let id
  const wrapper = (...wrapperArgs) => {
    globalThis.___timeouts--
    delete globalThis.___knownIds[id]
    fn(...wrapperArgs)
  }
  id = globalThis.___originalSetTimeout(wrapper, timeout, ...args)
  globalThis.___knownIds[id] = {
    delay: timeout,
    stack: new Error().stack,
  }
  return id
}

globalThis.clearTimeout = (id) => {
  if(globalThis.___knownIds[id]){
    globalThis.___timeouts--
    delete globalThis.___knownIds[id]
  }
  globalThis.___originalClearTimeout(id)
}


})()
undefined
`,
    objectGroup,
  })
}

export const stopTrackingTimeouts = async (session: Session, objectGroup: string) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___knownIds = Object.create(null)
globalThis.setTimeout = globalThis.___originalSetTimeout
globalThis.clearTimeout = globalThis.___originalClearTimeout
})()
undefined
`,
    objectGroup,
  })
}

export const getTimeoutCount = async (session: Session): Promise<number> => {
  const count = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'globalThis.___timeouts',
    returnByValue: false,
  })
  return count
}

export const getTimeoutsWithStackTraces = async (session: Session): Promise<readonly unknown[]> => {
  return DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'Object.values(globalThis.___knownIds)',
    returnByValue: true,
  })
}
