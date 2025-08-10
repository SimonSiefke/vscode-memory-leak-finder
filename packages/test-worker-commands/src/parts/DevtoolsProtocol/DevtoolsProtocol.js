const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolDebugger } = module

export { DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolDebugger }
