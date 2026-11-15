const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).href
const module = await import(url)

const { DevtoolsProtocolDebugger, DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolInput } = module

export { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolInput }
