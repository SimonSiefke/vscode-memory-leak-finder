const url = new URL('../../../../devtools-protocol/src/index.js', import.meta.url).href
const module = await import(url)

const {
  DevtoolsProtocolDomDebugger,
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolMemory,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
} = module

export {
  DevtoolsProtocolHeapProfiler,
  DevtoolsProtocolPage,
  DevtoolsProtocolRuntime,
  DevtoolsProtocolTarget,
  DevtoolsProtocolMemory,
  DevtoolsProtocolDomDebugger,
}
