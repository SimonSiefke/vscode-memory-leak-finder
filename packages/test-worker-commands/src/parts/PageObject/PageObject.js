import { join } from 'path'
import { pathToFileURL } from 'url'
import * as Assert from '../Assert/Assert.js'
import * as Root from '../Root/Root.js'

const pageObjectPath = join(Root.root, 'packages', 'page-object', 'src', 'main.js')
const pageObjectUrl = pathToFileURL(pageObjectPath).toString()

export const create = async (context) => {
  Assert.object(context)
  const pageObjectModule = await import(pageObjectUrl)
  const pageObject = pageObjectModule.create(context)
  return pageObject
}
