import * as GetErrorResponse from '../GetErrorResponse/GetErrorResponse.js'
import * as GetSuccessResponse from '../GetSuccessResponse/GetSuccessResponse.js'

import type { IpcMessage, ExecuteFunction } from '../Types/Types.js'

export const getResponse = async (message: IpcMessage, execute: ExecuteFunction): Promise<IpcMessage> => {
  try {
    const result = await execute(message.method, ...message.params)
    return GetSuccessResponse.getSuccessResponse(message, result)
  } catch (error) {
    return GetErrorResponse.getErrorResponse(message, error)
  }
}
