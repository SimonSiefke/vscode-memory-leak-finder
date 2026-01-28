import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const startTrackingDomNodeStackTraces = async (session: Session, objectGroup: string): Promise<void> => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{

// based on https://github.com/sindresorhus/callsites
const callsites = () => {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack.slice(2);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack.join('\\n')
}

const originalCreateElement = document.createElement.bind(document)
globalThis.___originalCreateElement = originalCreateElement

document.createElement = function (...args){
  const stackTrace = callsites()
  const node = originalCreateElement.apply(this, args)
  node.___stackTrace = stackTrace
  return node
}
})()
undefined
`,
    objectGroup,
  })
}
