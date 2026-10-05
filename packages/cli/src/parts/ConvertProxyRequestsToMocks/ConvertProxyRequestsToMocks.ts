interface ConvertRequestsToMocksModule {
  convertRequestsToMocksMain(): Promise<void>
}

export const convertProxyRequestsToMocks = async (): Promise<void> => {
  const moduleUrl = new URL('../../../../proxy-worker/src/parts/ConvertRequestsToMocks/ConvertRequestsToMocks.ts', import.meta.url)
  const module = (await import(moduleUrl.href)) as ConvertRequestsToMocksModule
  await module.convertRequestsToMocksMain()
}
