import waitForLocalhost from 'wait-for-localhost'
import { VError } from '../VError/VError.ts'

export const getJson = async (port: number): Promise<any[]> => {
  try {
    console.log('waiting for port...')
    await waitForLocalhost({
      port,
      signal: AbortSignal.timeout(30_000),
      path: '/json/list',
      useGet: true,
    })
    console.log('got port...')

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
    if (error.message && error.message.includes('Timed out waiting for')) {
      throw new VError(
        error,
        `Debug port ${port} did not become available within 30 seconds. The utility process may not have started yet. Try triggering the utility process by using the relevant feature (e.g., open an extension for --inspect-extensions, or use terminal for --inspect-ptyhost)`,
      )
    }
    throw new VError(error, `Failed to get JSON from DevTools on port ${port}`)
  }
}
