import type { TestContext } from '../types.js'

export const skip = true

const floodScript = `
import { writeFile } from 'node:fs/promises'
import { once } from 'node:events'

const frame = '\\u001b[2K\\r' + 'x'.repeat(4 * 1024)
const frameCount = 2 * 1024

for (let i = 0; i < frameCount; i++) {
  if (!process.stdout.write(frame)) {
    await once(process.stdout, 'drain')
  }
}

await new Promise((resolve, reject) => {
  process.stdout.write('\\n', (error) => {
    if (error) {
      reject(error)
      return
    }
    resolve()
  })
})
await writeFile('terminal-output-complete.txt', 'complete')
`.trim()

const responsivenessScript = `
import { writeFile } from 'node:fs/promises'

await writeFile('terminal-responsive.txt', 'responsive')
`.trim()

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([
    {
      content: floodScript,
      name: 'terminal-output-flood.mjs',
    },
    {
      content: responsivenessScript,
      name: 'terminal-responsive.mjs',
    },
  ])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.execute('node terminal-output-flood.mjs', {
    waitForFile: 'terminal-output-complete.txt',
  })
  await Workspace.remove('terminal-output-complete.txt')

  await Terminal.execute('node terminal-responsive.mjs', {
    waitForFile: 'terminal-responsive.txt',
  })
  await Workspace.remove('terminal-responsive.txt')
}

export const teardown = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([])
}
