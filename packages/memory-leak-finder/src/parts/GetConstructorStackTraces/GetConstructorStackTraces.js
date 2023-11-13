import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

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
  return stackTraces
}
