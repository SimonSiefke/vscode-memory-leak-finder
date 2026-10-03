export const objectUrlTrackerScript = `(() => {
  if (globalThis.___memoryLeakFinderObjectUrlTracker) {
    return
  }

  const url = globalThis.URL
  if (typeof url?.createObjectURL !== 'function' || typeof url?.revokeObjectURL !== 'function') {
    return
  }

  const originalCreateObjectURL = url.createObjectURL
  const originalRevokeObjectURL = url.revokeObjectURL
  const activeUrls = new Set()
  let created = 0
  let revoked = 0

  function createObjectURL(...args) {
    created++
    const objectUrl = originalCreateObjectURL.apply(this, args)
    activeUrls.add(objectUrl)
    return objectUrl
  }

  function revokeObjectURL(...args) {
    revoked++
    activeUrls.delete(args[0])
    return originalRevokeObjectURL.apply(this, args)
  }

  url.createObjectURL = createObjectURL
  url.revokeObjectURL = revokeObjectURL

  globalThis.___memoryLeakFinderObjectUrlTracker = {
    dispose() {
      if (url.createObjectURL === createObjectURL) {
        url.createObjectURL = originalCreateObjectURL
      }
      if (url.revokeObjectURL === revokeObjectURL) {
        url.revokeObjectURL = originalRevokeObjectURL
      }
      delete globalThis.___memoryLeakFinderObjectUrlTracker
    },
    getCounts() {
      return { created, revoked, unreleased: activeUrls.size }
    },
  }
})()`
