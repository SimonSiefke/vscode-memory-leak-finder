const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage, DevtoolsProtocolFetch, DevtoolsProtocolDebugger } = module

export { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage, DevtoolsProtocolFetch, DevtoolsProtocolDebugger }
