import { execFileSync } from 'node:child_process'
import { mkdir, readdir, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
const active = [
  'activity-bar-toggle.ts',
  'activity-bar-tooltip.ts',
  'base.ts',
  'debug-console-toggle.ts',
  'developer-toggle-screen-cast-mode.ts',
  'editor-grid-view-toggle.ts',
  'editor-merge-conflict.ts',
  'editor-new-text-file.ts',
  'editor-open.ts',
  'editor-split-down.ts',
  'editor-split-left.ts',
  'editor-split-right.ts',
  'editor-split-three-columns.ts',
  'editor-split-up-three-times-close-all-editor-groups.ts',
  'editor-split-up-twice-close-all-editor-groups.ts',
  'editor-split-up.ts',
  'editor-switch-between-tabs.ts',
  'editor-toggle-pin.ts',
  'editor-toggle-read-only.ts',
  'explorer-expand-and-collapse.ts',
  'explorer-focus.ts',
  'explorer-open.ts',
  'explorer-refresh.ts',
  'keybindings-editor-open.ts',
  'keybindings-editor-set-keybinding.ts',
]
const target = 'markdown-edit-git-disabled.ts'
const allBefore = (await readdir('packages/e2e/src')).filter((name) => name.endsWith('.ts') && name < target)
await mkdir('.tmp', { recursive: true })
let failures = 0
for (const [label, names] of [
  ['active-original-root', active],
  ['complete-original-root', allBefore],
]) {
  console.log('[PR3443 PROBE]', label, names.length)
  await rename('.vscode-user-data-dir', resolve('.tmp/pr3443-profile-before-' + label)).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  try {
    execFileSync(process.execPath, ['packages/cli/bin/test.js', '--cwd', 'packages/e2e', '--runs', '1'], {
      stdio: 'inherit',
      timeout: 300000,
      env: { ...process.env, PR3443_PROBE_TESTS: JSON.stringify([...names, target]) },
    })
    console.log('[PR3443 RESULT]', label, 'PASS')
  } catch (error) {
    failures++
    console.log('[PR3443 RESULT]', label, 'FAIL', error.status)
  }
}
process.exitCode = failures ? 1 : 0
