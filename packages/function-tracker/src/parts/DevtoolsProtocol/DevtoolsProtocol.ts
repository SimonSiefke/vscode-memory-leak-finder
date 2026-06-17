const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).href
const module = await import(url)

const { DevtoolsProtocolPage, DevtoolsProtocolTarget } = module

export { DevtoolsProtocolTarget, DevtoolsProtocolPage }
