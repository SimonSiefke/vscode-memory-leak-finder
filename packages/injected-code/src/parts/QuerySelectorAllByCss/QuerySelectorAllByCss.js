import * as Assert from '../Assert/Assert.js'

const querySelectorRoot = (root, body) => {
  Assert.object(root)
  Assert.string(body)
  return Array.from(root.querySelectorAll(body))
}

export const querySelectorAll = (roots, body) => {
  Assert.array(roots)
  Assert.string(body)
  console.log({ roots })
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
