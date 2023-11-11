import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const startTrackingTimeouts = async (session, objectGroup) => {
  // object group is required for function preview to work
  // see https://github.com/puppeteer/puppeteer/issues/3349#issuecomment-548428762

  const evaluateResult = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___timeouts = 0

globalThis.___originalSetTimeout = globalThis.setTimeout.bind(globalThis)
globalThis.___originalClearTimeout = globalThis.clearTimeout.bind(globalThis)
globalThis.setTimeout = (fn, timeout) => {
  globalThis.___timeouts++
  const wrapper = () => {
    globalThis.___timeouts--
    fn()
  }
  globalThis.___originalSetTimeout(wrapper, timeout)
}

globalThis.clearTimeout = (id) => {
  globalThis.___timeouts--
  globalThis.___originalClearTimeout(id)
}


})()
undefined
`,
    objectGroup,
  })

  return 0
}

export const stopTrackingTimeouts = async (session, objectGroup) => {
  // TODO
}

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getTimeoutCount = async (session) => {
  const count = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: 'globalThis.___timeouts',
    returnByValue: false,
  })
  return count
}
