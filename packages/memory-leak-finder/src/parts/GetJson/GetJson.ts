import { VError } from '../VError/VError.ts'

export const getJson = async (port: number): Promise<any[]> => {
  try {
    const response = await fetch(`http://localhost:${port}/json/list`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const targets = await response.json()
    if (!Array.isArray(targets)) {
      throw new Error(`Expected array but got ${typeof targets}`)
    }
    
    return targets
  } catch (error) {
    throw new VError(error, `Failed to get JSON from DevTools on port ${port}`)
  }
}
