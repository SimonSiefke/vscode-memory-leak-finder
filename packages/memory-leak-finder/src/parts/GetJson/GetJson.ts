export const getJson = async (port: number): Promise<any[]> => {
  const response = await fetch(`http://localhost:${port}/json/list`)
  if (!response.ok) {
    throw new Error(`Failed to fetch DevTools JSON list from port ${port}: ${response.status} ${response.statusText}`)
  }

  const targets = await response.json()
  if (!Array.isArray(targets)) {
    throw new Error(`Invalid JSON response format from port ${port}: expected array`)
  }

  return targets
}
