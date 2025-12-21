import * as ConvertRequestsToMocks from './ConvertRequestsToMocks/ConvertRequestsToMocks.ts'

export const convertRequestsToMocksMain = async (): Promise<void> => {
  await ConvertRequestsToMocks.convertRequestsToMocks()
}
