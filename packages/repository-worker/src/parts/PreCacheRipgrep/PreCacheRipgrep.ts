import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'
import * as os from 'os'

// Configuration constants
const RIPGREP_VERSION = 'v13.0.0-13'
const MULTI_ARCH_VERSION = 'v13.0.0-4' // For arm and powerpc64le
const VSCODE_RIPGREP_VERSION = '1.15.14' // Current @vscode/ripgrep version

/**
 * Determines the target platform for ripgrep binary using Node.js APIs
 */
const getTarget = (): string => {
  const arch = process.env.npm_config_arch || os.arch()
  const platform = os.platform()
  
  switch (platform) {
    case 'darwin':
      return arch === 'arm64' || arch === 'aarch64' 
        ? 'aarch64-apple-darwin' 
        : 'x86_64-apple-darwin'
    
    case 'linux':
      switch (arch) {
        case 'x64': return 'x86_64-unknown-linux-musl'
        case 'arm64': 
        case 'aarch64': return 'aarch64-unknown-linux-musl'
        case 'arm':
        case 'armv7l': return 'arm-unknown-linux-gnueabihf'
        case 'ppc64': return 'powerpc64le-unknown-linux-gnu'
        case 'riscv64': return 'riscv64gc-unknown-linux-gnu'
        case 's390x': return 's390x-unknown-linux-gnu'
        case 'ia32':
        case 'x32': return 'i686-unknown-linux-musl'
        default: return 'x86_64-unknown-linux-musl'
      }
    
    case 'win32':
      switch (arch) {
        case 'x64': return 'x86_64-pc-windows-msvc'
        case 'arm64': return 'aarch64-pc-windows-msvc'
        default: return 'i686-pc-windows-msvc'
      }
    
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Gets the appropriate version for the target platform
 */
const getVersionForTarget = (target: string): string => {
  const multiArchTargets = [
    'arm-unknown-linux-gnueabihf',
    'powerpc64le-unknown-linux-gnu', 
    's390x-unknown-linux-gnu'
  ]
  
  return multiArchTargets.includes(target) ? MULTI_ARCH_VERSION : RIPGREP_VERSION
}

/**
 * Downloads a file using Node.js built-in modules with retry logic
 */
const downloadWithRetry = async (url: string, outputPath: string, maxRetries = 3): Promise<void> => {
  const https = await import('https')
  const fs = await import('fs')
  const { URL } = await import('url')
  
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.log(`[ripgrep] Downloading ${url} (attempt ${attempt}/${maxRetries})`)
      
      await new Promise<void>((resolve, reject) => {
        const parsedUrl = new URL(url)
        const file = fs.createWriteStream(outputPath)
        
        const request = https.get({
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: {
            'User-Agent': 'vscode-memory-leak-finder/1.0.0'
          }
        }, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            file.close()
            const redirectUrl = response.headers.location
            if (redirectUrl) {
              Logger.log(`[ripgrep] Following redirect to: ${redirectUrl}`)
              downloadWithRetry(redirectUrl, outputPath, 1).then(resolve).catch(reject)
              return
            }
          }
          
          if (response.statusCode !== 200) {
            file.close()
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
            return
          }
          
          response.pipe(file)
          
          file.on('finish', () => {
            file.close()
            resolve()
          })
          
          file.on('error', (err) => {
            file.close()
            fs.unlink(outputPath, () => {}) // Clean up on error
            reject(err)
          })
        })
        
        request.on('error', (err) => {
          file.close()
          fs.unlink(outputPath, () => {}) // Clean up on error
          reject(err)
        })
        
        request.setTimeout(30000, () => {
          request.destroy()
          file.close()
          fs.unlink(outputPath, () => {}) // Clean up on timeout
          reject(new Error('Download timeout'))
        })
      })
      
      return // Success
      
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        Logger.log(`[ripgrep] Download failed, retrying in 2 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }
  
  throw new VError(lastError!, `Failed to download after ${maxRetries} attempts`)
}

/**
 * Pre-caches ripgrep binary to avoid GitHub API 403 errors
 */
export const preCacheRipgrep = async (): Promise<void> => {
  try {
    Logger.log('[ripgrep] Pre-caching ripgrep binary to avoid GitHub API issues')
    
    // Determine target platform
    const target = getTarget()
    Logger.log(`[ripgrep] Detected target: ${target}`)
    
    // Get appropriate version
    const version = getVersionForTarget(target)
    Logger.log(`[ripgrep] Using version: ${version}`)
    
    // Construct asset name
    const extension = os.platform() === 'win32' ? '.zip' : '.tar.gz'
    const assetName = `ripgrep-${version}-${target}${extension}`
    Logger.log(`[ripgrep] Asset name: ${assetName}`)
    
    // Create cache directory
    const cacheDir = Path.join(os.tmpdir(), `vscode-ripgrep-cache-${VSCODE_RIPGREP_VERSION}`)
    const cachePath = Path.join(cacheDir, assetName)
    
    // Check if already cached
    const cacheExists = await FileSystemWorker.pathExists(cachePath)
    if (cacheExists) {
      Logger.log(`[ripgrep] Asset already cached at: ${cachePath}`)
      return
    }
    
    // Create cache directory
    await FileSystemWorker.makeDirectory(cacheDir)
    Logger.log(`[ripgrep] Cache directory: ${cacheDir}`)
    
    // Construct direct download URL (bypassing GitHub API)
    const downloadUrl = `https://github.com/microsoft/ripgrep-prebuilt/releases/download/${version}/${assetName}`
    
    // Download the asset
    Logger.log(`[ripgrep] Downloading from: ${downloadUrl}`)
    await downloadWithRetry(downloadUrl, cachePath)
    
    // Verify the download
    const downloadExists = await FileSystemWorker.pathExists(cachePath)
    if (!downloadExists) {
      throw new Error('Downloaded file is missing')
    }
    
    Logger.log(`[ripgrep] Successfully cached ripgrep asset at: ${cachePath}`)
    
  } catch (error) {
    throw new VError(error, 'Failed to pre-cache ripgrep binary')
  }
}