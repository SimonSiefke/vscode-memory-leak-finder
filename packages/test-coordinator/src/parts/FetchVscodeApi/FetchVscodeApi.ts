import { VError } from '@lvce-editor/verror'

export const fetchVscodeApi = async <T>(url: string): Promise<T> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vscode-memory-leak-finder/1.0.0',
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as T
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError(error, `Failed to fetch from URL: ${url}`)
  }
}
