const disposables = []

export const add = (fn) => {
  disposables.push(fn)
}

export const disposeAll = async () => {
  for (const fn of disposables) {
    await fn()
  }
  disposables.length = 0
}
