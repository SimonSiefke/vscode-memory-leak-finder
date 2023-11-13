import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

const getPrettyStackTrace = (value) => {
  return {
    ...value,
    stackTrace: SplitLines.splitLines(value.stackTrace),
  }
}

export const getConstructorStackTraces = async (session, objectGroup, key) => {
  const stackTraces = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
  const getStackTraces = key => {
    return globalThis['___stackTraces'+key]
  }
  return getStackTraces('${key}')
})()`,
    returnByValue: true,
    objectGroup,
  })
  console.log({ stackTraces })
  const betterStackTraces = stackTraces.map(getPrettyStackTrace)
  return betterStackTraces
}
