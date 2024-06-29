const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).toString()
const module = await import(url)

const { DevtoolsProtocolHeapProfiler, DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolMemory } =
  module

export { DevtoolsProtocolHeapProfiler, DevtoolsProtocolPage, DevtoolsProtocolRuntime, DevtoolsProtocolTarget, DevtoolsProtocolMemory }
