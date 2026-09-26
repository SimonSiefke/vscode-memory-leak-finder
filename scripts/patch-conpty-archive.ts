import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createPackageFromStreams, extractFile, listPackage, statFile } from '../.tmp/asar-tools/node_modules/@electron/asar/lib/asar.js'

export const agentPath = 'node-pty/lib/windowsPtyAgent.js'

export const patchConptyArchive = async (source: string, destination: string) => {
  const before = extractFile(source, agentPath).toString('utf8')
  const needle = `            this._outSocket.on('data', function () {
                _this._conoutSocketWorker.dispose();
            });`
  assert.equal(before.split(needle).length, 2, 'Unexpected bundled node-pty implementation')
  const after = before.replace(needle, needle + '\n            this._conoutSocketWorker.dispose();')
  const paths = listPackage(source, { isPack: false }).map((path) => path.replaceAll('\\', '/').replace(/^\//, ''))
  const streams = paths.map((path) => {
    const entry = statFile(source, path, false)
    const unpacked = !!entry.unpacked
    if ('files' in entry) return { type: 'directory' as const, path, unpacked }
    // The official Windows dependency archive has no symbolic links.
    assert.ok(!('link' in entry), `Unexpected archive link: ${path}`)
    const getBytes = () => (path === agentPath ? Buffer.from(after) : extractFile(source, path))
    return {
      type: 'file' as const,
      path,
      unpacked,
      stat: { size: path === agentPath ? Buffer.byteLength(after) : entry.size, mode: entry.executable ? 0o755 : 0o644 },
      streamGenerator: () => Readable.from([getBytes()]),
    }
  })
  await createPackageFromStreams(destination, streams)
  assert.deepEqual(listPackage(destination, { isPack: false }), listPackage(source, { isPack: false }), 'Archive entries changed')
  let verifiedFiles = 0
  for (const path of paths) {
    const original = statFile(source, path, false)
    const candidate = statFile(destination, path, false)
    assert.equal(!!candidate.unpacked, !!original.unpacked, `Unpacked layout changed: ${path}`)
    if ('files' in original) continue
    assert.deepEqual(extractFile(destination, path), path === agentPath ? Buffer.from(after) : extractFile(source, path), path)
    verifiedFiles++
  }
  return { before, after, verifiedFiles }
}
