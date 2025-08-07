const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolRuntime, DevtoolsProtocolDebugger } = module

export { DevtoolsProtocolRuntime, DevtoolsProtocolDebugger }
