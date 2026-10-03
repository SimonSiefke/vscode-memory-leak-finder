import type { MemoryCityBuilding, MemoryCityDataset, MemoryCityOwner, MemoryCitySnapshot } from './types.ts'

const sourcePaths = [
  'src/vs/editor/browser/widget/codeEditor/codeEditorWidget.ts',
  'src/vs/editor/common/model/textModel.ts',
  'src/vs/workbench/browser/parts/editor/editorGroupView.ts',
  'src/vs/workbench/services/editor/common/editorService.ts',
  'src/vs/base/common/event.ts',
  'src/vs/base/common/lifecycle.ts',
  'src/vs/platform/instantiation/common/instantiationService.ts',
  'src/vs/workbench/contrib/chat/browser/chatWidget.ts',
  'src/vs/workbench/contrib/terminal/browser/terminalInstance.ts',
  'extensions/typescript-language-features/src/extension.ts',
  'extensions/git/src/model.ts',
  'external/node_modules/vscode-textmate/release/main.js',
  'runtime/unattributed/native',
  'runtime/unattributed/string',
  'runtime/unattributed/array',
]

const makeBuilding = (path: string, index: number, factor: number, ownerFactor: number): MemoryCityBuilding => {
  const wave = 0.72 + Math.sin(index * 1.77 + factor) * 0.22
  const objectCount = Math.max(12, Math.round((1800 / (index + 2) + 35) * ownerFactor * wave))
  const retainedBytes = Math.round(objectCount * (740 + index * 185) * factor)
  return {
    kind: path.startsWith('runtime/') ? 'runtime' : 'source',
    largestObjectRetainedBytes: Math.round(retainedBytes * (0.17 + (index % 4) * 0.06)),
    objectCount,
    path,
    retainedBytes,
    shallowBytes: Math.round(retainedBytes * 0.61),
  }
}

const makeSnapshot = (factor: number, owner: MemoryCityOwner): MemoryCitySnapshot => {
  const ownerFactor = owner === 'renderer' ? 1 : 0.58
  const buildings = sourcePaths.map((path, index) => makeBuilding(path, index, factor + (owner === 'renderer' ? 0 : 0.18), ownerFactor))
  const objectCount = buildings.reduce((total, item) => total + item.objectCount, 0)
  const shallowBytes = buildings.reduce((total, item) => total + item.shallowBytes, 0)
  const runtimeObjects = buildings.filter((item) => item.kind === 'runtime').reduce((total, item) => total + item.objectCount, 0)
  return {
    buildings,
    totals: {
      allocationTraceObjects: Math.round(objectCount * 0.42),
      attributedObjects: objectCount - runtimeObjects,
      locationObjects: Math.round(objectCount * 0.08),
      objectCount,
      retainedBytes: buildings.reduce((total, item) => total + item.retainedBytes, 0),
      runtimeObjects,
      shallowBytes,
    },
  }
}

export const sampleData: MemoryCityDataset = {
  revisions: [
    {
      id: '3d8c71a',
      label: 'base · 3d8c71a',
      owners: {
        extensionHost: makeSnapshot(0.88, 'extensionHost'),
        renderer: makeSnapshot(0.9, 'renderer'),
      },
    },
    {
      id: 'e117ac2',
      label: 'editor lifecycle · e117ac2',
      owners: {
        extensionHost: makeSnapshot(0.96, 'extensionHost'),
        renderer: makeSnapshot(1.04, 'renderer'),
      },
    },
    {
      id: 'f4b29da',
      label: 'candidate · f4b29da',
      owners: {
        extensionHost: makeSnapshot(1.08, 'extensionHost'),
        renderer: makeSnapshot(1.18, 'renderer'),
      },
    },
  ],
  scenario: 'editor-open-close',
  schemaVersion: 1,
}
