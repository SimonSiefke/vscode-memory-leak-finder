const waitForTimeout = (maxDelay: number) => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  let disposed = false
  const dispose = () => {
    if (disposed) {
      return
    }
    disposed = true
    clearTimeout(timeout)
    resolve()
  }
  const timeout = setTimeout(dispose, maxDelay)
  return { promise, dispose }
}

const waitForMutationInternal = (element: Node) => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  let disposed = false
  const dispose = () => {
    if (disposed) {
      return
    }
    disposed = true
    observer.disconnect()
    resolve()
  }
  const callback = () => {
    dispose()
  }
  const observer = new MutationObserver(callback)
  observer.observe(element, {
    attributeOldValue: true,
    attributes: true,
    characterData: true,
    characterDataOldValue: true,
    childList: true,
    subtree: true,
  })
  return { promise, dispose }
}

export const waitForMutation = async (element: Node | null, maxDelay: number) => {
  let timeout: ReturnType<typeof waitForTimeout> | undefined
  let mutation: ReturnType<typeof waitForMutationInternal> | undefined
  try {
    timeout = waitForTimeout(maxDelay)
    if (!element) {
      await timeout.promise
      return
    }
    mutation = waitForMutationInternal(element)
    await Promise.race([timeout.promise, mutation.promise])
  } finally {
    timeout?.dispose()
    mutation?.dispose()
  }
}
