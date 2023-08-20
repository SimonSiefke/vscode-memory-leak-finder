import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getTestCoordinatorUrl = () => {
  const url = join(Root.root, 'packages/test-coordinator/bin/test-coordinator.js')
  return url
}
