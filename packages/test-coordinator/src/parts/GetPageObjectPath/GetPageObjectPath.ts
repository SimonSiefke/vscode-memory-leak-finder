import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getPageObjectPath = () => {
  return join(Root.root, 'packages', 'page-object', 'src', 'main.ts')
}
