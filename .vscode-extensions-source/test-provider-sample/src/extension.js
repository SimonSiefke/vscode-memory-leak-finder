import {
  tests as _tests,
  EventEmitter,
  TestRunRequest,
  TestRunProfileKind,
  StatementCoverage,
  Position,
  workspace,
  RelativePattern,
  FileCoverage,
  Uri,
  TestCoverageCount,
} from 'vscode'
import { getContentFromFilesystem, TestCase, testData, TestFile } from './testTree'

export async function activate(context) {
  const ctrl = _tests.createTestController('mathTestController', 'Markdown Math')
  context.subscriptions.push(ctrl)

  const fileChangedEmitter = new EventEmitter()
  const watchingTests = new Map()
  fileChangedEmitter.event((uri) => {
    if (watchingTests.has('ALL')) {
      startTestRun(new TestRunRequest(undefined, undefined, watchingTests.get('ALL'), true))
      return
    }

    const include = []
    let profile
    for (const [item, thisProfile] of watchingTests) {
      const cast = item
      if (cast.uri?.toString() == uri.toString()) {
        include.push(cast)
        profile = thisProfile
      }
    }

    if (include.length) {
      startTestRun(new TestRunRequest(include, undefined, profile, true))
    }
  })

  const runHandler = (request, cancellation) => {
    if (!request.continuous) {
      return startTestRun(request)
    }

    if (request.include === undefined) {
      watchingTests.set('ALL', request.profile)
      cancellation.onCancellationRequested(() => watchingTests.delete('ALL'))
    } else {
      request.include.forEach((item) => watchingTests.set(item, request.profile))
      cancellation.onCancellationRequested(() => request.include.forEach((item) => watchingTests.delete(item)))
    }
  }

  const startTestRun = (request) => {
    const queue = []
    const run = ctrl.createTestRun(request)
    // map of file uris to statements on each line:
    const coveredLines = new Map()

    const discoverTests = async (tests) => {
      for (const test of tests) {
        if (request.exclude?.includes(test)) {
          continue
        }

        const data = testData.get(test)
        if (data instanceof TestCase) {
          run.enqueued(test)
          queue.push({ test, data })
        } else {
          if (data instanceof TestFile && !data.didResolve) {
            await data.updateFromDisk(ctrl, test)
          }

          await discoverTests(gatherTestItems(test.children))
        }

        if (test.uri && !coveredLines.has(test.uri.toString()) && request.profile?.kind === TestRunProfileKind.Coverage) {
          try {
            const lines = (await getContentFromFilesystem(test.uri)).split('\n')
            coveredLines.set(
              test.uri.toString(),
              lines.map((lineText, lineNo) => (lineText.trim().length ? new StatementCoverage(0, new Position(lineNo, 0)) : undefined)),
            )
          } catch {
            // ignored
          }
        }
      }
    }

    const runTestQueue = async () => {
      for (const { test, data } of queue) {
        run.appendOutput(`Running ${test.id}\r\n`)
        if (run.token.isCancellationRequested) {
          run.skipped(test)
        } else {
          run.started(test)
          await data.run(test, run)
        }

        const lineNo = test.range.start.line
        const fileCoverage = coveredLines.get(test.uri.toString())
        const lineInfo = fileCoverage?.[lineNo]
        if (lineInfo) {
          lineInfo.executed++
        }

        run.appendOutput(`Completed ${test.id}\r\n`)
      }

      for (const [uri, statements] of coveredLines) {
        run.addCoverage(new MarkdownFileCoverage(uri, statements))
      }

      run.end()
    }

    discoverTests(request.include ?? gatherTestItems(ctrl.items)).then(runTestQueue)
  }

  ctrl.refreshHandler = async () => {
    await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => findInitialFiles(ctrl, pattern)))
  }

  ctrl.createRunProfile('Run Tests', TestRunProfileKind.Run, runHandler, true, undefined, true)

  const coverageProfile = ctrl.createRunProfile('Run with Coverage', TestRunProfileKind.Coverage, runHandler, true, undefined, true)
  coverageProfile.loadDetailedCoverage = async (_testRun, coverage) => {
    if (coverage instanceof MarkdownFileCoverage) {
      return coverage.coveredLines.filter((l) => !!l)
    }

    return []
  }

  ctrl.resolveHandler = async (item) => {
    if (!item) {
      context.subscriptions.push(...startWatchingWorkspace(ctrl, fileChangedEmitter))
      return
    }

    const data = testData.get(item)
    if (data instanceof TestFile) {
      await data.updateFromDisk(ctrl, item)
    }
  }

  function updateNodeForDocument(e) {
    if (e.uri.scheme !== 'file') {
      return
    }

    if (!e.uri.path.endsWith('.md')) {
      return
    }

    const { file, data } = getOrCreateFile(ctrl, e.uri)
    data.updateFromContents(ctrl, e.getText(), file)
  }

  for (const document of workspace.textDocuments) {
    updateNodeForDocument(document)
  }

  context.subscriptions.push(
    workspace.onDidOpenTextDocument(updateNodeForDocument),
    workspace.onDidChangeTextDocument((e) => updateNodeForDocument(e.document)),
  )
}

function getOrCreateFile(controller, uri) {
  const existing = controller.items.get(uri.toString())
  if (existing) {
    return { file: existing, data: testData.get(existing) }
  }

  const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop(), uri)
  controller.items.add(file)

  const data = new TestFile()
  testData.set(file, data)

  file.canResolveChildren = true
  return { file, data }
}

function gatherTestItems(collection) {
  const items = []
  collection.forEach((item) => items.push(item))
  return items
}

function getWorkspaceTestPatterns() {
  if (!workspace.workspaceFolders) {
    return []
  }

  return workspace.workspaceFolders.map((workspaceFolder) => ({
    workspaceFolder,
    pattern: new RelativePattern(workspaceFolder, '**/*.md'),
  }))
}

async function findInitialFiles(controller, pattern) {
  for (const file of await workspace.findFiles(pattern)) {
    getOrCreateFile(controller, file)
  }
}

function startWatchingWorkspace(controller, fileChangedEmitter) {
  return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
    const watcher = workspace.createFileSystemWatcher(pattern)

    watcher.onDidCreate((uri) => {
      getOrCreateFile(controller, uri)
      fileChangedEmitter.fire(uri)
    })
    watcher.onDidChange(async (uri) => {
      const { file, data } = getOrCreateFile(controller, uri)
      if (data.didResolve) {
        await data.updateFromDisk(controller, file)
      }
      fileChangedEmitter.fire(uri)
    })
    watcher.onDidDelete((uri) => controller.items.delete(uri.toString()))

    findInitialFiles(controller, pattern)

    return watcher
  })
}

class MarkdownFileCoverage extends FileCoverage {
  constructor(uri, coveredLines) {
    super(Uri.parse(uri), new TestCoverageCount(0, 0))
    this.coveredLines = coveredLines
    for (const line of coveredLines) {
      if (line) {
        this.statementCoverage.covered += line.executed ? 1 : 0
        this.statementCoverage.total++
      }
    }
  }
}
