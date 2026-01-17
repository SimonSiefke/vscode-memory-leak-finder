const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage } = module

export { DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolPage }
