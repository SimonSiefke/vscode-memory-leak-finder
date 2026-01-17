import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ SideBar, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Workspace.setFiles([])
  await SideBar.hide()

  await Terminal.show({
    waitForReady: true,
  })
}

export const run = async ({ Terminal, Workspace }: TestContext): Promise<void> => {
  // Create a Node.js script that prints a link
  const linkScript = `
console.log('Visit https://www.example.com for more information');
console.log('Another link: https://github.com/microsoft/vscode');
console.log('Local file link: file:///home/user/test.txt');
  `.trim()

  // Write the script to a file
  await Workspace.setFiles([
    {
      content: linkScript,
      name: 'print-links.js',
    },
  ])

  // Execute the Node.js script
  await Terminal.execute('node print-links.js')

  // Wait a moment for the output to appear
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Clear the terminal
  await Terminal.clear()

  // Clean up the test file
  await Workspace.remove('print-links.js')
}

export const teardown = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
}
