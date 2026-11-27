import type { TestContext } from '../types.ts'

// The WebAssembly diff algorithm ("advanced-wasm") is available from VS Code 1.148.
// Run with --enable-extensions --vscode-version 1.148.0 (or later).
export const skip = 1

const fileNames = ['alpha.txt', 'beta.txt', 'gamma.txt']

const getOriginalContent = (fileName: string): string => {
  const name = fileName.replace('.txt', '')
  return `${name} header\n${name} value\n${name} footer\n`
}

const getModifiedContent = (fileName: string, cycle: number): string => {
  const name = fileName.replace('.txt', '')
  return `${name} header\n${name} value changed ${cycle}\n${name} footer\n`
}

let cycle = 0

const writeModifiedFiles = async (Workspace: TestContext['Workspace'], currentCycle: number): Promise<void> => {
  for (const fileName of fileNames) {
    await Workspace.add({ content: getModifiedContent(fileName, currentCycle), name: fileName })
  }
}

const shouldShowCycle = async (MultiDiffEditor: TestContext['MultiDiffEditor'], currentCycle: number): Promise<void> => {
  await MultiDiffEditor.shouldBeVisible()
  await MultiDiffEditor.shouldHaveFileCount(fileNames.length)
  for (const [index, fileName] of fileNames.entries()) {
    await MultiDiffEditor.shouldHaveEntry(index, {
      fileName,
      modifiedText: getModifiedContent(fileName, currentCycle),
      originalText: getOriginalContent(fileName),
    })
  }
}

export const setup = async ({ Editor, Extensions, MultiDiffEditor, SourceControl, Workspace }: TestContext): Promise<void> => {
  await Extensions.add({
    expectedName: 'scm-multi-diff-opener-sample',
    path: 'packages/e2e/fixtures/sample.scm-multi-diff-opener',
  })
  await Editor.closeAll()
  await Workspace.setFilesWithoutWaiting(fileNames.map((fileName) => ({ content: getOriginalContent(fileName), name: fileName })))
  // Committed with the initial files, so Source Control only lists the three text files.
  await Workspace.updateWorkspaceSettings({ 'diffEditor.diffAlgorithm': 'advanced-wasm' })
  await Workspace.initializeGitRepository()
  await Workspace.gitAdd()
  await Workspace.gitCommit('initial files')
  cycle = 0
  await writeModifiedFiles(Workspace, cycle)
  await SourceControl.show()
  for (const fileName of fileNames) {
    await SourceControl.shouldHaveUnstagedFile(fileName)
  }
  // The first Source Control snapshot can predate the commit and list the settings file as untracked.
  await SourceControl.refresh()
  await SourceControl.shouldNotHaveUnstagedFile('settings.json')

  // Warm up once and prove the diffs came from the WebAssembly module, because a
  // load failure silently falls back to the built-in algorithm.
  try {
    await MultiDiffEditor.openSourceControlChanges()
    await shouldShowCycle(MultiDiffEditor, cycle)
    await MultiDiffEditor.shouldUseWebAssemblyDiff()
  } finally {
    await Editor.closeAll()
  }
  await MultiDiffEditor.shouldBeClosed()
}

export const run = async ({ Editor, MultiDiffEditor, SourceControl, Workspace }: TestContext): Promise<void> => {
  cycle++
  // New content each cycle, so a cached diff cannot satisfy the assertions.
  await writeModifiedFiles(Workspace, cycle)
  await SourceControl.refresh()
  try {
    await MultiDiffEditor.openSourceControlChanges()
    await shouldShowCycle(MultiDiffEditor, cycle)
  } finally {
    await Editor.closeAll()
  }
  await MultiDiffEditor.shouldBeClosed()
}

export const teardown = async ({ Editor, MultiDiffEditor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await MultiDiffEditor.shouldBeClosed()
  // The diff worker still holds the WebAssembly module after all cycles.
  await MultiDiffEditor.shouldUseWebAssemblyDiff()
  // Also removes .vscode/settings.json, restoring the default diff algorithm.
  await Workspace.setFiles([])
}
