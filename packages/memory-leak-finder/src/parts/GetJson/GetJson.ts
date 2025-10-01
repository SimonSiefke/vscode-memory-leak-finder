import { VError } from '../VError/VError.ts'

export const getJson = async (port: number): Promise<any[]> => {
  try {
    const response = await fetch(`http://localhost:${port}/json/list`)
    if (!response.ok) {
      throw new VError(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        `Failed to fetch DevTools JSON list from port ${port}`
      )
    }

    const targets = await response.json()
    if (!Array.isArray(targets)) {
      throw new VError(
        new Error(`Expected array but got ${typeof targets}`),
        `Invalid JSON response format from port ${port}`
      )
    }

    return targets
  } catch (error) {
    if (error instanceof VError) {
      throw error
    }
    throw new VError(error, `Failed to get JSON from DevTools on port ${port}`)
  }
}
