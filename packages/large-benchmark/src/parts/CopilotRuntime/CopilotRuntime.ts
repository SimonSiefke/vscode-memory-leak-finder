import { cp, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { command } from '../Io/Io.ts'

// Some revisions strip the standalone CLI from the product while the built-in
// Copilot extension still imports its SDK. Preserve that revision's installed,
// postinstall-materialized runtime rather than downloading a different version.
export const preserveCopilotRuntime = async (source: string, build: string): Promise<void> => {
  const extension = join(source, 'extensions/copilot')
  let manifest: { dependencies?: Record<string, string> }
  try {
    manifest = JSON.parse(await readFile(join(extension, 'package.json'), 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return // Older revisions have no built-in Copilot extension.
    throw error
  }
  if (!manifest.dependencies?.['@github/copilot']) return
  const runtime = 'node_modules/@github/copilot'
  const destination = join(build, 'resources/app/extensions/copilot', runtime)
  await mkdir(dirname(destination), { recursive: true })
  await cp(join(extension, runtime), destination, { recursive: true, dereference: true })
  // Fail during preparation if the SDK or one of its runtime dependencies is
  // still missing, rather than repeating two-minute chat timeouts per sample.
  await command(process.execPath, ['--input-type=module', '-e', "await import('@github/copilot/sdk')"], {
    cwd: join(build, 'resources/app/extensions/copilot'),
  })
}
