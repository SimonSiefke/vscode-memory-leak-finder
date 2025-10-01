import { VError } from '../VError/VError.ts'
import waitOn from 'wait-on'

export const getJson = async (port: number): Promise<any[]> => {
  try {
    // Wait for the debug port to be ready
    await waitOn({
      resources: [`http://localhost:${port}/json/list`],
      timeout: 30000,
    })

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
