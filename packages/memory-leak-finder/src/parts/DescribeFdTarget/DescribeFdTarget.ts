/**
 * Get a human-readable description for a file descriptor target
 */
export const describeFdTarget = (target: string): string => {
  // Standard streams
  if (target.includes('/dev/pts/') || target.includes('/dev/tty')) {
    return 'terminal/tty'
  }
  if (target.startsWith('pipe:[')) {
    return 'pipe'
  }
  if (target.startsWith('socket:[')) {
    return 'socket'
  }
  if (target.startsWith('anon_inode:[eventpoll]')) {
    return 'epoll instance (event notification)'
  }
  if (target.startsWith('anon_inode:[eventfd]')) {
    return 'eventfd (event signaling)'
  }
  if (target.startsWith('anon_inode:[io_uring]')) {
    return 'io_uring (async I/O)'
  }
  if (target.startsWith('anon_inode:inotify')) {
    return 'inotify (file system watcher)'
  }
  if (target.startsWith('anon_inode:[timerfd]')) {
    return 'timerfd (timer)'
  }
  if (target.startsWith('anon_inode:[signalfd]')) {
    return 'signalfd (signal handling)'
  }
  if (target.startsWith('anon_inode:')) {
    return 'anonymous inode'
  }
  if (target.startsWith('/memfd:')) {
    return 'memory-backed file'
  }
  if (target.startsWith('/dmabuf:')) {
    return 'DMA buffer (GPU/hardware)'
  }
  if (target.startsWith('/dev/')) {
    return 'device file'
  }
  if (target.includes('(deleted)')) {
    return 'deleted file (still open)'
  }
  if (target.startsWith('/proc/')) {
    return 'proc filesystem'
  }
  if (target.startsWith('/sys/')) {
    return 'sys filesystem'
  }
  if (target.startsWith('/tmp/')) {
    return 'temporary file'
  }
  if (target.includes('.log')) {
    return 'log file'
  }
  if (target.includes('.db') || target.includes('leveldb') || target.includes('LOCK') || target.includes('MANIFEST')) {
    return 'database file'
  }
  if (target.includes('.so') || target.includes('.so.')) {
    return 'shared library'
  }
  if (target.includes('.ttf') || target.includes('.otf') || target.includes('fonts')) {
    return 'font file'
  }
  if (target.includes('.js') || target.includes('.map')) {
    return 'JavaScript/source file'
  }
  if (target.endsWith('.bdic')) {
    return 'dictionary file'
  }

  // If it looks like a regular file path
  if (target.startsWith('/')) {
    return 'regular file'
  }

  return 'unknown'
}
