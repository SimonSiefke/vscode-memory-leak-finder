const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage } = module

export { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolDebugger, DevtoolsProtocolPage }
