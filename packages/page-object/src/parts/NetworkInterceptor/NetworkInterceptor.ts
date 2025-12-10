export const create = ({ page, VError }) => {
  let isEnabled = false
  let requestPausedHandler: ((event: any) => Promise<void>) | null = null

  const enableFetchDomain = async (): Promise<void> => {
    if (isEnabled) {
      return
    }

    try {
      const sessionRpc = page.sessionRpc

      // Enable Fetch domain
      await sessionRpc.invoke('Fetch.enable', {
        handleAuthRequests: false,
        patterns: [
          {
            urlPattern: '*api.github.com*',
          },
          {
            urlPattern: '*github.com/api*',
          },
        ],
      })

      // Listen for requestPaused events
      requestPausedHandler = async (event: any): Promise<void> => {
        const requestId = event.params.requestId
        const requestUrl = event.params.request.url

        // Check if this is a GitHub API request
        if (requestUrl.includes('api.github.com') || requestUrl.includes('github.com/api')) {
          // Create a mock response
          const mockResponse = {
            responseCode: 200,
            responseHeaders: [
              {
                name: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: Buffer.from(
              JSON.stringify({
                message: 'Mock response',
                data: [],
              }),
            ).toString('base64'),
          }

          // Fulfill the request with the mock response
          await sessionRpc.invoke('Fetch.fulfillRequest', {
            requestId,
            responseCode: mockResponse.responseCode,
            responseHeaders: mockResponse.responseHeaders,
            body: mockResponse.body,
          })
        } else {
          // For non-GitHub API requests, continue normally
          await sessionRpc.invoke('Fetch.continueRequest', {
            requestId,
          })
        }
      }

      sessionRpc.on('Fetch.requestPaused', requestPausedHandler)

      isEnabled = true
    } catch (error) {
      throw new VError(error, `Failed to enable network interceptor`)
    }
  }

  const disableFetchDomain = async (): Promise<void> => {
    if (!isEnabled) {
      return
    }

    try {
      const sessionRpc = page.sessionRpc
      if (requestPausedHandler) {
        sessionRpc.off('Fetch.requestPaused', requestPausedHandler)
        requestPausedHandler = null
      }
      await sessionRpc.invoke('Fetch.disable', {})
      isEnabled = false
    } catch (error) {
      throw new VError(error, `Failed to disable network interceptor`)
    }
  }

  return {
    async enable() {
      try {
        await enableFetchDomain()
      } catch (error) {
        throw new VError(error, `Failed to enable network interceptor`)
      }
    },
    async disable() {
      try {
        await disableFetchDomain()
      } catch (error) {
        throw new VError(error, `Failed to disable network interceptor`)
      }
    },
    async [Symbol.asyncDispose]() {
      await disableFetchDomain()
    },
  }
}
