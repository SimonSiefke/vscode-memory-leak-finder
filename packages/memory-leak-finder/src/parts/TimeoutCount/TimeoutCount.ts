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
globalThis.setTimeout = (fn, timeout) => {
  globalThis.___timeouts++
  const wrapper = () => {
    globalThis.___timeouts--
    fn()
  }
  const id = globalThis.___originalSetTimeout(wrapper, timeout)
  globalThis.___knownIds[id] = true
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
