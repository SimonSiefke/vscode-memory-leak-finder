import fs from 'fs'
import { VSCodeTrackerOptions, FunctionStatistics } from '../Types/Types.js'

export class VSCodeFunctionTracker {
  // @ts-ignore

  private browser: Browser | null = null
  // @ts-ignore

  private page: Page | null = null
  private trackedCode: string | null = null
  private options: VSCodeTrackerOptions

  constructor(options: VSCodeTrackerOptions = {}) {
    this.options = {
      headless: false,
      devtools: true,
      remoteDebuggingPort: 9222,
      vscodeUrl: 'http://localhost:8080',
      ...options,
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing Chrome DevTools connection...')

    // Read the transformed code
    const transformedPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/packages/function-tracker/workbench.desktop.main.tracked.js'
    if (fs.existsSync(transformedPath)) {
      this.trackedCode = fs.readFileSync(transformedPath, 'utf8')
      console.log('Loaded transformed code')
    } else {
      throw new Error('Transformed code not found. Run apply-transform.js first.')
    }

    // Launch browser with remote debugging
    // @ts-ignore
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      devtools: this.options.devtools,
      args: [
        `--remote-debugging-port=${this.options.remoteDebuggingPort}`,
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    })

    this.page = await this.browser.newPage()

    // Set up request interception to modify scripts
    await this.page.setRequestInterception(true)
    this.page.on('request', (request: any) => {
      const url = request.url()

      // Intercept workbench.desktop.main.js requests
      if (url.includes('workbench.desktop.main.js')) {
        console.log('Intercepting workbench.desktop.main.js request')
        request.respond({
          status: 200,
          contentType: 'application/javascript',
          body: this.trackedCode!,
        })
      } else {
        request.continue()
      }
    })

    console.log('Chrome DevTools connection ready')
    console.log(`Remote debugging available at: http://localhost:${this.options.remoteDebuggingPort}`)
  }

  async loadVSCode(): Promise<void> {
    if (!this.page) {
      throw new Error('Tracker not initialized. Call initialize() first.')
    }

    console.log('Loading VS Code...')

    // Navigate to VS Code
    await this.page.goto(this.options.vscodeUrl!)

    // Wait for VS Code to load
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('VS Code loaded with function tracking enabled')
  }

  async getFunctionStatistics(): Promise<FunctionStatistics> {
    if (!this.page) {
      throw new Error('Tracker not initialized. Call initialize() first.')
    }

    const stats = await this.page.evaluate(() => {
      if (typeof globalThis.getFunctionStatistics === 'function') {
        return globalThis.getFunctionStatistics()
      }
      return {}
    })

    return stats
  }

  async resetStatistics(): Promise<void> {
    if (!this.page) {
      throw new Error('Tracker not initialized. Call initialize() first.')
    }

    await this.page.evaluate(() => {
      if (typeof globalThis.resetFunctionStatistics === 'function') {
        globalThis.resetFunctionStatistics()
      }
    })
  }

  async printStatistics(): Promise<void> {
    const stats = await this.getFunctionStatistics()
    console.log('\n=== Function Call Statistics ===')

    const sortedStats = Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20) // Top 20 functions

    for (const [funcName, count] of sortedStats) {
      console.log(`${funcName}: ${count} calls`)
    }

    console.log(`\nTotal functions tracked: ${Object.keys(stats).length}`)
    console.log(`Total function calls: ${Object.values(stats).reduce((a, b) => a + b, 0)}`)
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }

  isInitialized(): boolean {
    return this.browser !== null && this.page !== null
  }
}
