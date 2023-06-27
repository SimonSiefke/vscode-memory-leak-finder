import * as Command from '../Command/Command.js'

export const handleJsonRpcMessage = async (message) => {
  const { method, params } = message
  await Command.execute(method, ...params)
}
