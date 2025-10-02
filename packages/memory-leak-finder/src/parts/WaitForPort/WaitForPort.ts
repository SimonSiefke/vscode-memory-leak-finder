const isOpen = async (url: string) => {
  try {
    await fetch(url)
    return true
  } catch {
    return false
  }
}

export const waitForPort = async (port: number, path: string): Promise<void> => {
  const maxTimeout = 30_000
  const start = performance.now()
  while (true) {
    const now = performance.now()
    if (now - start > maxTimeout) {
      break
    }
    if (await isOpen(`http://localhost:${port}${path}`)) {
      break
    }
  }
}
