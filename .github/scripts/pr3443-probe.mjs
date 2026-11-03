import { execFileSync } from 'node:child_process'
import { mkdir, rename, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const preceding = [
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
let failures = 0
for (const count of [0, 8, 16, preceding.length]) {
  const label = 'prefix-' + count
  console.log('[PR3443 PROBE]', label)
  const destination = resolve('.tmp/pr3443-probe-' + count)
  await mkdir(join(destination, 'src'), { recursive: true })
  const names = [...preceding.slice(0, count), 'markdown-edit-git-disabled.ts']
  for (const name of names) {
    await symlink(resolve('packages/e2e/src', name), join(destination, 'src', name))
  }
  await rename('.vscode-user-data-dir', resolve('.tmp/pr3443-profile-before-' + count)).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  try {
    execFileSync(process.execPath, ['packages/cli/bin/test.js', '--cwd', destination, '--runs', '1'], { stdio: 'inherit', timeout: 300000 })
    console.log('[PR3443 RESULT]', label, 'PASS')
  } catch (error) {
    failures++
    console.log('[PR3443 RESULT]', label, 'FAIL', error.status)
  }
}
process.exitCode = failures ? 1 : 0
