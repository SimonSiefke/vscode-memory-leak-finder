import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getPageObjectPath = (pageObjectPath?: string) => {
  if (pageObjectPath && pageObjectPath.trim() !== '') {
    return pageObjectPath
  }
  return join(Root.root, 'packages', 'page-object', 'src', 'main.ts')
}
