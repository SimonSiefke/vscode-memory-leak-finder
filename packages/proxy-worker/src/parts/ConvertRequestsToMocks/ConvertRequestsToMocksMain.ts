import * as ConvertRequestsToMocks from './ConvertRequestsToMocks.ts'

ConvertRequestsToMocks.convertRequestsToMocksMain()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to convert requests to mocks:', error)
    process.exit(1)
  })
