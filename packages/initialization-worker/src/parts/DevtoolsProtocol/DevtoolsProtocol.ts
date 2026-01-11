const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } = module

export { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolDebugger }
