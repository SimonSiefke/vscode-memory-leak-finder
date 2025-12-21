import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'content to be deleted',
      name: 'file-to-delete.txt',
    },
    {
      content: 'this should remain',
      name: 'keep-this-file.txt',
    },
    {
      content: 'nested content',
      name: 'nested-folder/file-in-folder.txt',
    },
    {
      content: 'another nested file',
      name: 'nested-folder/another-file.txt',
    },
    {
      content: 'placeholder',
      name: 'empty-folder/placeholder.txt',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('keep-this-file.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.remove('file-to-delete.txt')
  await Explorer.refresh()

  await Explorer.not.toHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('keep-this-file.txt') // Other file should remain

  await Workspace.remove('nested-folder/file-in-folder.txt')
  await Explorer.refresh()

  await Explorer.expand('nested-folder')
  await Explorer.not.toHaveItem('file-in-folder.txt')
  await Explorer.shouldHaveItem('another-file.txt') // Other file in folder should remain

  await Workspace.remove('nested-folder/another-file.txt')
  await Workspace.remove('nested-folder/')
  await Explorer.refresh()

  await Explorer.collapse('nested-folder')
  await Explorer.not.toHaveItem('nested-folder')

  await Workspace.remove('empty-folder/')
  await Explorer.refresh()

  await Explorer.not.toHaveItem('empty-folder')
  await Explorer.shouldHaveItem('keep-this-file.txt')

  await Workspace.add({
    content: 'content to be deleted',
    name: 'file-to-delete.txt',
  })
  await Workspace.add({
    content: 'nested content',
    name: 'nested-folder/file-in-folder.txt',
  })
  await Workspace.add({
    content: 'another nested file',
    name: 'nested-folder/another-file.txt',
  })
  await Workspace.add({
    content: 'placeholder',
    name: 'empty-folder/placeholder.txt',
  })
  await Explorer.refresh()

  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}
