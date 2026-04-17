const defaultErrorPrefix = 'Bun subprocess leak measurement is not supported yet'

export const assertSupportedSubprocessMeasure = (
  checkLeaks: boolean,
  measure: string,
  measureNodeSubprocess: boolean,
  subprocessRuntime: 'bun' | 'node',
): void => {
  if (!checkLeaks || !measureNodeSubprocess || subprocessRuntime !== 'bun') {
    return
  }

  if (measure === 'emitter-count') {
    return
  }

  if (measure === 'named-emitter-count') {
    throw new Error(
      `${defaultErrorPrefix} because Bun inspector does not implement the HeapProfiler domain, which is required for named-emitter-count`,
    )
  }

  throw new Error(
    `${defaultErrorPrefix} because Bun inspector currently does not implement Runtime.queryObjects or the HeapProfiler domain used by current measures`,
  )
}
