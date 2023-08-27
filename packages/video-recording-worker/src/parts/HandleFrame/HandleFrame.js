import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { mkdir, writeFile } from 'node:fs/promises'

let i = 1

export const handleFrame = async (message) => {
  const videosPath = join(Root.root, '.videos')
  await mkdir(videosPath, { recursive: true })
  const jpegPath = join(videosPath, `${i++}.jpeg`)
  const { data, metadata } = message.params
  await writeFile(jpegPath, data, 'base64')
  console.log({ metadata })
}
