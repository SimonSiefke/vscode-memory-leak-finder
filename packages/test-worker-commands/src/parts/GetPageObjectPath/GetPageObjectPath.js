import { join } from 'path'
import * as Root from '../Root/Root.js'

export const getPageObjectPath = () => {
  return join(Root.root, 'packages', 'page-object', 'src', 'main.js')
}
