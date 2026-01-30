import { test, expect } from '@jest/globals'
import { describeFdTarget } from '../src/parts/GetFileDescriptorCount/DescribeFdTarget/index.ts'

test('describeFdTarget - terminal/tty with /dev/pts/', () => {
  expect(describeFdTarget('/dev/pts/0')).toBe('terminal/tty')
  expect(describeFdTarget('/dev/pts/1')).toBe('terminal/tty')
  expect(describeFdTarget('/dev/pts/10')).toBe('terminal/tty')
})

test('describeFdTarget - terminal/tty with /dev/tty', () => {
  expect(describeFdTarget('/dev/tty')).toBe('terminal/tty')
  expect(describeFdTarget('/dev/tty0')).toBe('terminal/tty')
  expect(describeFdTarget('/dev/ttyS0')).toBe('terminal/tty')
})

test('describeFdTarget - pipe', () => {
  expect(describeFdTarget('pipe:[1234]')).toBe('pipe')
  expect(describeFdTarget('pipe:[5678]')).toBe('pipe')
  expect(describeFdTarget('pipe:[999999999]')).toBe('pipe')
})

test('describeFdTarget - socket', () => {
  expect(describeFdTarget('socket:[1234]')).toBe('socket')
  expect(describeFdTarget('socket:[5678]')).toBe('socket')
  expect(describeFdTarget('socket:[999999999]')).toBe('socket')
})

test('describeFdTarget - epoll instance', () => {
  expect(describeFdTarget('anon_inode:[eventpoll]')).toBe('epoll instance (event notification)')
  expect(describeFdTarget('anon_inode:[eventpoll] (some extra info)')).toBe('epoll instance (event notification)')
})

test('describeFdTarget - eventfd', () => {
  expect(describeFdTarget('anon_inode:[eventfd]')).toBe('eventfd (event signaling)')
  // Note: variants with colons don't match the exact pattern check in the implementation
  expect(describeFdTarget('anon_inode:[eventfd:0]')).toBe('anonymous inode')
  expect(describeFdTarget('anon_inode:[eventfd:11]')).toBe('anonymous inode')
})

test('describeFdTarget - io_uring', () => {
  expect(describeFdTarget('anon_inode:[io_uring]')).toBe('io_uring (async I/O)')
  // Note: variants with colons don't match the exact pattern check
  expect(describeFdTarget('anon_inode:[io_uring:1234]')).toBe('anonymous inode')
})

test('describeFdTarget - inotify', () => {
  expect(describeFdTarget('anon_inode:inotify')).toBe('inotify (file system watcher)')
  expect(describeFdTarget('anon_inode:inotify (some info)')).toBe('inotify (file system watcher)')
})

test('describeFdTarget - timerfd', () => {
  expect(describeFdTarget('anon_inode:[timerfd]')).toBe('timerfd (timer)')
  // Note: variants with colons don't match the exact pattern check
  expect(describeFdTarget('anon_inode:[timerfd:0]')).toBe('anonymous inode')
  expect(describeFdTarget('anon_inode:[timerfd:1]')).toBe('anonymous inode')
})

test('describeFdTarget - signalfd', () => {
  expect(describeFdTarget('anon_inode:[signalfd]')).toBe('signalfd (signal handling)')
  // Note: variants with colons don't match the exact pattern check
  expect(describeFdTarget('anon_inode:[signalfd:0]')).toBe('anonymous inode')
})

test('describeFdTarget - generic anon_inode', () => {
  expect(describeFdTarget('anon_inode:[unknown_type]')).toBe('anonymous inode')
  expect(describeFdTarget('anon_inode:[futex]')).toBe('anonymous inode')
  expect(describeFdTarget('anon_inode:some_other_type')).toBe('anonymous inode')
})

test('describeFdTarget - memfd', () => {
  expect(describeFdTarget('/memfd:test')).toBe('memory-backed file')
  expect(describeFdTarget('/memfd:my-file')).toBe('memory-backed file')
  expect(describeFdTarget('/memfd:var.text')).toBe('memory-backed file')
})

test('describeFdTarget - dmabuf', () => {
  expect(describeFdTarget('/dmabuf:buffer1')).toBe('DMA buffer (GPU/hardware)')
  expect(describeFdTarget('/dmabuf:123456')).toBe('DMA buffer (GPU/hardware)')
})

test('describeFdTarget - device file', () => {
  expect(describeFdTarget('/dev/null')).toBe('device file')
  expect(describeFdTarget('/dev/zero')).toBe('device file')
  expect(describeFdTarget('/dev/urandom')).toBe('device file')
  expect(describeFdTarget('/dev/sda1')).toBe('device file')
  expect(describeFdTarget('/dev/dm-0')).toBe('device file')
})

test('describeFdTarget - deleted file', () => {
  expect(describeFdTarget('/home/user/file.txt (deleted)')).toBe('deleted file (still open)')
  expect(describeFdTarget('/var/log/app.log (deleted)')).toBe('deleted file (still open)')
  expect(describeFdTarget('some_file (deleted)')).toBe('deleted file (still open)')
  expect(describeFdTarget('(deleted)')).toBe('deleted file (still open)')
})

test('describeFdTarget - proc filesystem', () => {
  expect(describeFdTarget('/proc/1234/fd')).toBe('proc filesystem')
  expect(describeFdTarget('/proc/self/cmdline')).toBe('proc filesystem')
  expect(describeFdTarget('/proc/meminfo')).toBe('proc filesystem')
})

test('describeFdTarget - sys filesystem', () => {
  expect(describeFdTarget('/sys/class/net')).toBe('sys filesystem')
  expect(describeFdTarget('/sys/devices/pci0000:00')).toBe('sys filesystem')
})

test('describeFdTarget - temporary file', () => {
  expect(describeFdTarget('/tmp/tmpfile')).toBe('temporary file')
  expect(describeFdTarget('/tmp/cache')).toBe('temporary file')
  expect(describeFdTarget('/tmp/test.dat')).toBe('temporary file')
})

test('describeFdTarget - log file', () => {
  expect(describeFdTarget('/var/log/app.log')).toBe('log file')
  expect(describeFdTarget('/home/user/debug.log')).toBe('log file')
  // Note: /tmp takes precedence because of ordering
  expect(describeFdTarget('/tmp/output.log')).toBe('temporary file')
})

test('describeFdTarget - database file', () => {
  expect(describeFdTarget('/home/user/database.db')).toBe('database file')
  expect(describeFdTarget('/var/lib/leveldb/data')).toBe('database file')
  expect(describeFdTarget('/home/user/.config/LOCK')).toBe('database file')
  expect(describeFdTarget('/var/lib/MANIFEST')).toBe('database file')
  expect(describeFdTarget('/data/app.db')).toBe('database file')
})

test('describeFdTarget - shared library', () => {
  expect(describeFdTarget('/usr/lib/libssl.so')).toBe('shared library')
  expect(describeFdTarget('/lib64/libc.so.6')).toBe('shared library')
  expect(describeFdTarget('/lib/x86_64-linux-gnu/libz.so.1')).toBe('shared library')
})

test('describeFdTarget - font file', () => {
  expect(describeFdTarget('/usr/share/fonts/Roboto.ttf')).toBe('font file')
  expect(describeFdTarget('/home/user/.fonts/font.otf')).toBe('font file')
  expect(describeFdTarget('/etc/fonts/Arial.ttf')).toBe('font file')
  expect(describeFdTarget('/usr/share/fonts/fonts.conf')).toBe('font file')
})

test('describeFdTarget - JavaScript/source file', () => {
  expect(describeFdTarget('/app/bundle.js')).toBe('JavaScript/source file')
  expect(describeFdTarget('/home/user/script.js')).toBe('JavaScript/source file')
  expect(describeFdTarget('/var/www/app.js.map')).toBe('JavaScript/source file')
  expect(describeFdTarget('/dist/main.js.map')).toBe('JavaScript/source file')
})

test('describeFdTarget - dictionary file', () => {
  expect(describeFdTarget('/usr/share/en.bdic')).toBe('dictionary file')
  expect(describeFdTarget('/data/spelling.bdic')).toBe('dictionary file')
})

test('describeFdTarget - regular file with absolute path', () => {
  expect(describeFdTarget('/home/user/file.txt')).toBe('regular file')
  expect(describeFdTarget('/var/data/config')).toBe('regular file')
  expect(describeFdTarget('/etc/hosts')).toBe('regular file')
})

test('describeFdTarget - unknown targets', () => {
  expect(describeFdTarget('some_relative_path')).toBe('unknown')
  expect(describeFdTarget('file.txt')).toBe('unknown')
  expect(describeFdTarget('')).toBe('unknown')
})

test('describeFdTarget - edge case: deleted takes precedence', () => {
  // Deleted files containing other patterns should still be "deleted file"
  expect(describeFdTarget('/var/log/app.log (deleted)')).toBe('deleted file (still open)')
  expect(describeFdTarget('/home/user/app.db (deleted)')).toBe('deleted file (still open)')
  // Note: socket pattern matches before deleted check
  expect(describeFdTarget('socket:[1234] (deleted)')).toBe('socket')
})

test('describeFdTarget - edge case: specific patterns take precedence over generic ones', () => {
  // More specific patterns should match before generic ones
  expect(describeFdTarget('/dev/pts/0')).toBe('terminal/tty')
  expect(describeFdTarget('pipe:[123]')).toBe('pipe')
  expect(describeFdTarget('socket:[123]')).toBe('socket')
  expect(describeFdTarget('anon_inode:[eventpoll]')).toBe('epoll instance (event notification)')
})

test('describeFdTarget - complex real-world paths', () => {
  // VSCode specific paths
  expect(describeFdTarget('/home/user/.vscode/extensions/some-extension/dist/main.js')).toBe('JavaScript/source file')
  expect(describeFdTarget('/home/user/.config/Code/Cache/data.db')).toBe('database file')

  // Node.js specific
  expect(describeFdTarget('/home/user/node_modules/.bin/some-lib.so')).toBe('shared library')
  expect(describeFdTarget('/tmp/npm-cache/data')).toBe('temporary file')

  // System paths
  expect(describeFdTarget('/sys/class/net/eth0')).toBe('sys filesystem')
  expect(describeFdTarget('/proc/self/stat')).toBe('proc filesystem')
})

test('describeFdTarget - case sensitivity', () => {
  // Should handle case-sensitive matching properly
  expect(describeFdTarget('/Dev/pts/0')).not.toBe('terminal/tty')
  expect(describeFdTarget('/Tmp/file')).not.toBe('temporary file')
  expect(describeFdTarget('/TMP/file')).not.toBe('temporary file')
})

test('describeFdTarget - whitespace handling', () => {
  // Note: includes() matches substring anywhere, so leading/trailing whitespace doesn't prevent match
  expect(describeFdTarget('/dev/pts/0 ')).toBe('terminal/tty')
  expect(describeFdTarget(' /dev/pts/0')).toBe('terminal/tty')
  expect(describeFdTarget('pipe:[123] extra')).toBe('pipe')
})
