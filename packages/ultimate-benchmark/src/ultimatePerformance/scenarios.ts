import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Cdp, click, key, palette, typeKeys, waitExpression } from './cdp.ts'
import type { Benchmark } from './types.ts'

export const prepareFixture = async (workspace: string): Promise<void> => {
  await mkdir(join(workspace, 'folder'), { recursive: true })
  await writeFile(join(workspace, 'small.txt'), 'ultimate needle\nsmall deterministic file\n')
  await writeFile(
    join(workspace, 'large.txt'),
    Array.from({ length: 20000 }, (_, i) => `line ${i} ultimate needle ${'x'.repeat(60)}\n`).join(''),
  )
  await writeFile(join(workspace, 'before.txt'), 'ultimate needle\nunchanged\nbefore\n')
  await writeFile(join(workspace, 'after.txt'), 'ultimate needle\nunchanged\nafter\n')
  for (let i = 0; i < 20; i++) await writeFile(join(workspace, 'folder', `item-${i}.txt`), `fixture ${i} ultimate needle\n`)
}

export const waitReady = async (cdp: Cdp, workspace: boolean): Promise<void> => {
  await waitExpression(
    cdp,
    `!!document.querySelector('.monaco-workbench .part.editor')?.getBoundingClientRect().width`,
    'visible workbench',
  )
  if (workspace) await waitExpression(cdp, `(${editorText}).includes('ultimate needle')`, 'startup text editor')
}

const editorText = `(document.querySelector('.monaco-editor .view-lines')?.textContent || '').replace(/\\u00a0/g, ' ')`

const openFile = async (cdp: Cdp, file: string): Promise<void> => {
  await key(cdp, 'p', 'KeyP', 80, 2)
  await waitExpression(cdp, `!!document.querySelector('.quick-input-widget input')?.getBoundingClientRect().width`, 'Quick Open')
  await cdp.send('Input.insertText', { text: file })
  await waitExpression(
    cdp,
    `!!document.querySelector('.quick-input-list .monaco-list-row')?.textContent?.includes(${JSON.stringify(file)})`,
    'file result',
  )
  await key(cdp, 'Enter', 'Enter', 13)
  await waitExpression(
    cdp,
    `!!document.querySelector('.tabs-container .tab.active')?.textContent?.includes(${JSON.stringify(file)})`,
    'active editor',
  )
  await waitExpression(cdp, `(${editorText}).includes('ultimate needle')`, 'rendered file content')
}

export const setupAction = async (cdp: Cdp, benchmark: Benchmark): Promise<void> => {
  if (['type', 'scroll', 'find'].includes(benchmark.scenario))
    await openFile(cdp, benchmark.scenario === 'scroll' ? 'large.txt' : 'small.txt')
  else if (benchmark.scenario === 'diff') await openFile(cdp, 'before.txt')
  else if (benchmark.scenario === 'terminal-command') await createTerminal(cdp)
  else if (benchmark.scenario === 'explorer') await palette(cdp, 'View: Show Explorer')
  else if (benchmark.scenario === 'search') await key(cdp, 'f', 'KeyF', 70, 2 | 8)
  if (benchmark.scenario === 'open-small' || benchmark.scenario === 'open-large') await palette(cdp, 'View: Close All Editors')
}

const createTerminal = async (cdp: Cdp): Promise<void> => {
  await palette(cdp, 'Terminal: Create New Terminal')
  await waitExpression(cdp, `!!document.querySelector('.terminal .xterm-screen')?.getBoundingClientRect().width`, 'terminal screen')
  // PS1 is fixed to '$ ' in the isolated bash profile, so this asserts actual shell readiness.
  await waitExpression(
    cdp,
    `/\\$\\s/.test(document.querySelector('.terminal .xterm-accessibility-tree')?.textContent || '')`,
    'terminal shell ready',
  )
}

export const runAction = async (cdp: Cdp, benchmark: Benchmark, workspace: string): Promise<void> => {
  switch (benchmark.scenario) {
    case 'open-small':
      await openFile(cdp, 'small.txt')
      break
    case 'open-large':
      await openFile(cdp, 'large.txt')
      break
    case 'type':
      await click(cdp, '.monaco-editor textarea, .monaco-editor .native-edit-context')
      await typeKeys(cdp, 'a'.repeat(100))
      await waitExpression(cdp, `(${editorText}).includes(${JSON.stringify('a'.repeat(100))})`, '100 typed characters')
      break
    case 'scroll':
      {
        const position = await cdp.evaluate(
          `(() => { const r = document.querySelector('.monaco-editor .view-lines').getBoundingClientRect(); return {x: r.x + 100, y: r.y + 100} })()`,
        )
        const firstLine = await cdp.evaluate(`document.querySelector('.monaco-editor .view-line')?.textContent`)
        await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', deltaX: 0, deltaY: 1500, ...position })
        await waitExpression(
          cdp,
          `document.querySelector('.monaco-editor .view-line')?.textContent !== ${JSON.stringify(firstLine)}`,
          'scrolled editor',
        )
      }
      break
    case 'find':
      await key(cdp, 'f', 'KeyF', 70, 2)
      await cdp.send('Input.insertText', { text: 'ultimate needle' })
      await waitExpression(cdp, `!!document.querySelector('.find-widget .matchesCount')?.textContent?.match(/1 of 1/)`, 'find match')
      break
    case 'search':
      await click(cdp, '.search-view .search-widget textarea, .search-view .search-widget input')
      await cdp.send('Input.insertText', { text: 'small deterministic file' })
      await key(cdp, 'Enter', 'Enter', 13)
      await waitExpression(
        cdp,
        `!!document.querySelector('.search-view .messages')?.textContent?.match(/1 result in 1 file/)`,
        'workspace search result',
      )
      break
    case 'quick-open':
      await key(cdp, 'p', 'KeyP', 80, 2)
      await cdp.send('Input.insertText', { text: 'small.txt' })
      await waitExpression(
        cdp,
        `!!document.querySelector('.quick-input-list .monaco-list-row')?.textContent?.includes('small.txt')`,
        'Quick Open result',
      )
      break
    case 'explorer':
      await click(cdp, '[role="tree"][aria-label="Files Explorer"] [role="treeitem"][aria-label="folder"] .monaco-tl-twistie')
      await waitExpression(
        cdp,
        `!!document.querySelector('[role="tree"][aria-label="Files Explorer"]')?.textContent?.includes('item-0.txt')`,
        'expanded folder',
      )
      break
    case 'diff':
      await palette(cdp, 'File: Compare Active File With...', false)
      await waitExpression(
        cdp,
        `!!document.querySelector('.quick-input-widget input')?.getBoundingClientRect().width`,
        'comparison file picker',
      )
      await cdp.send('Input.insertText', { text: 'after.txt' })
      await waitExpression(
        cdp,
        `!!document.querySelector('.quick-input-list .monaco-list-row')?.textContent?.includes('after.txt')`,
        'comparison file result',
      )
      await key(cdp, 'Enter', 'Enter', 13)
      await waitExpression(cdp, `!!document.querySelector('.monaco-diff-editor')?.getBoundingClientRect().width`, 'visible diff editor')
      break
    case 'terminal-create':
      await createTerminal(cdp)
      break
    case 'terminal-command':
      await typeKeys(cdp, 'echo ULTIMATE_COMMAND_DONE')
      await key(cdp, 'Enter', 'Enter', 13)
      await waitExpression(
        cdp,
        `Array.from(document.querySelector('.terminal .xterm-accessibility-tree')?.children || []).some(e => e.textContent?.trim() === 'ULTIMATE_COMMAND_DONE')`,
        'terminal command result',
      )
      break
    case 'settings':
      await key(cdp, ',', 'Comma', 188, 2)
      await waitExpression(
        cdp,
        `!!document.querySelector('.settings-editor .settings-tree-container')?.getBoundingClientRect().width`,
        'settings editor',
      )
      break
    default:
      throw new Error(`No action for ${benchmark.scenario} at ${workspace}`)
  }
}
