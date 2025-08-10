import * as GetErrorResponse from '../GetErrorResponse/GetErrorResponse.ts'
import * as GetSuccessResponse from '../GetSuccessResponse/GetSuccessResponse.ts'

export const getResponse = async (message: any, execute: (command: string, ...args: any[]) => any): Promise<any> => {
  try {
    const result = await execute(message.method, ...message.params)
    return GetSuccessResponse.getSuccessResponse(message, result)
  } catch (error) {
    return GetErrorResponse.getErrorResponse(message, error)
  }
}
