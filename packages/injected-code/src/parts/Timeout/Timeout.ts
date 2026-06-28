const waitForTimeout = (maxDelay: number) => {
  const { promise, resolve } = Promise.withResolvers<void>()
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
  return { promise, [Symbol.dispose]: dispose }
}

const waitForMutationInternal = (element: Node) => {
  const { promise, resolve } = Promise.withResolvers<void>()
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
  return { promise, [Symbol.dispose]: dispose }
}

export const waitForMutation = async (element: Node, maxDelay: number) => {
  let timeout: ReturnType<typeof waitForTimeout> | undefined
  let mutation: ReturnType<typeof waitForMutationInternal> | undefined
  try {
    timeout = waitForTimeout(maxDelay)
    mutation = waitForMutationInternal(element)
    await Promise.race([timeout.promise, mutation.promise])
  } finally {
    timeout?.[Symbol.dispose]()
    mutation?.[Symbol.dispose]()
  }
}
