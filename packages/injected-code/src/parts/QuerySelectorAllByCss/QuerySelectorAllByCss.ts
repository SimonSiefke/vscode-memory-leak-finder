import * as Assert from '../Assert/Assert.ts'

const querySelectorRoot = (root, body) => {
  Assert.object(root)
  Assert.string(body)
  return [...root.querySelectorAll(body)]
}

export const querySelectorAll = (roots, body) => {
  Assert.array(roots)
  Assert.string(body)
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
