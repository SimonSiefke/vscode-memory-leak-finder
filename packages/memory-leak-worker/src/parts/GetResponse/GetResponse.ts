import * as GetErrorResponse from '../GetErrorResponse/GetErrorResponse.js'
import * as GetSuccessResponse from '../GetSuccessResponse/GetSuccessResponse.js'

import type { IpcMessage, ExecuteFunction } from '../Types/Types.js'

export const getResponse = async (message: IpcMessage, execute: ExecuteFunction): Promise<IpcMessage> => {
  try {
    if (!message.method) {
      throw new Error('Method is required')
    }
    const params = message.params || []
    const result = await execute(message.method, ...params)
    return GetSuccessResponse.getSuccessResponse(message, result)
  } catch (error) {
    return GetErrorResponse.getErrorResponse(message, error as any)
  }
}
