const disposables: Array<() => Promise<void> | void> = []

export const add = (fn: () => Promise<void> | void) => {
  disposables.push(fn)
}

export const disposeAll = async () => {
  for (const fn of disposables) {
    await fn()
  }
  disposables.length = 0
}
