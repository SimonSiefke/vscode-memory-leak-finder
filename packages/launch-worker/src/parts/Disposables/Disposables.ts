const disposables: any[] = []

export const add = (fn) => {
  disposables.push(fn)
}

const disposeAll = async () => {
  for (const fn of disposables) {
    await fn()
  }
  disposables.length = 0
}
