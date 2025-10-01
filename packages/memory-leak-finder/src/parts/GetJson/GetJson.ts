import { VError } from '../VError/VError.ts'
import waitOn from 'wait-on'

export const getJson = async (port: number): Promise<any[]> => {
  try {
    console.log(`[Memory Leak Finder] Waiting for debug port ${port} to be ready...`)

    // Wait for the debug port to be ready
    await waitOn({
      resources: [`http://localhost:${port}`],
      timeout: 30000,
    })

    console.log(`[Memory Leak Finder] Debug port ${port} is ready, fetching JSON...`)

    const response = await fetch(`http://localhost:${port}/json/list`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const targets = await response.json()
    if (!Array.isArray(targets)) {
      throw new Error(`Expected array but got ${typeof targets}`)
    }

    console.log(`[Memory Leak Finder] Successfully fetched ${targets.length} targets from port ${port}`)
    return targets
  } catch (error) {
    if (error.message && error.message.includes('Timed out waiting for')) {
      throw new VError(
        error,
        `Debug port ${port} did not become available within 30 seconds. The utility process may not have started yet. Try triggering the utility process by using the relevant feature (e.g., open an extension for --inspect-extensions, or use terminal for --inspect-ptyhost)`,
      )
    }
    throw new VError(error, `Failed to get JSON from DevTools on port ${port}`)
  }
}
