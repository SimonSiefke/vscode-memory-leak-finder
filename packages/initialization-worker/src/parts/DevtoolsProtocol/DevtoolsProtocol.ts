const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolDebugger, DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } = module

export { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolDebugger }
