export const getJson = async (url: string): Promise<any> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: {
      'User-Agent': 'vscode-memory-leak-finder/1.0.0',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const data = await response.json()
  return data
}
