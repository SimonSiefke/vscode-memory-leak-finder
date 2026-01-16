import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs'

interface FunctionStatistics {
  readonly [key: string]: number;
}

declare global {
  var getFunctionStatistics: (() => FunctionStatistics) | undefined;
  var resetFunctionStatistics: (() => void) | undefined;
}

export class VSCodeFunctionTracker {
  private browser: Browser | null = null
  private page: Page | null = null
  private trackedCode: string | null = null

  constructor() {
    this.browser = null
    this.page = null
    this.trackedCode = null
  }

  async initialize(): Promise<void> {
    console.log('Initializing Chrome DevTools connection...')
    
    // Read the transformed code
    const transformedPath: string = '/home/simon/.cache/repos/vscode-memory-leak-finder/packages/function-tracker/workbench.desktop.main.tracked.js'
    if (fs.existsSync(transformedPath)) {
      this.trackedCode = fs.readFileSync(transformedPath, 'utf8')
      console.log('Loaded transformed code')
    } else {
      throw new Error('Transformed code not found. Run apply-transform.js first.')
    }

    // Launch browser with remote debugging
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: [
        '--remote-debugging-port=9222',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    this.page = await this.browser.newPage()
    
    // Set up request interception to modify scripts
    await this.page.setRequestInterception(true)
    this.page.on('request', (request: any) => {
      const url: string = request.url()
      
      // Intercept workbench.desktop.main.js requests
      if (url.includes('workbench.desktop.main.js')) {
        console.log('Intercepting workbench.desktop.main.js request')
        request.respond({
          status: 200,
          contentType: 'application/javascript',
          body: this.trackedCode!
        })
      } else {
        request.continue()
      }
    })

    console.log('Chrome DevTools connection ready')
    console.log('Remote debugging available at: http://localhost:9222')
  }

  async loadVSCode(): Promise<void> {
    console.log('Loading VS Code...')
    
    // Navigate to VS Code (assuming it's running as a web app)
    // For desktop VS Code, we might need a different approach
    await this.page!.goto('http://localhost:8080') // Adjust URL as needed
    
    // Wait for VS Code to load
    await this.page!.waitForTimeout(5000)
    
    console.log('VS Code loaded with function tracking enabled')
  }

  async getFunctionStatistics(): Promise<FunctionStatistics> {
    const stats: FunctionStatistics = await this.page!.evaluate(() => {
      if (typeof globalThis.getFunctionStatistics === 'function') {
        return globalThis.getFunctionStatistics()
      }
      return {}
    })
    
    return stats
  }

  async resetStatistics(): Promise<void> {
    await this.page!.evaluate(() => {
      if (typeof globalThis.resetFunctionStatistics === 'function') {
        globalThis.resetFunctionStatistics()
      }
    })
  }

  async printStatistics(): Promise<void> {
    const stats: FunctionStatistics = await this.getFunctionStatistics()
    console.log('\n=== Function Call Statistics ===')
    
    const sortedStats = Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
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
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const tracker = new VSCodeFunctionTracker()
  
  try {
    await tracker.initialize()
    
    // Set up periodic statistics printing
    const printInterval = setInterval(async () => {
      await tracker.printStatistics()
    }, 10000) // Print every 10 seconds
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...')
      clearInterval(printInterval)
      await tracker.printStatistics()
      await tracker.close()
      process.exit(0)
    })
    
    console.log('Function tracker is running. Press Ctrl+C to stop and see final statistics.')
    console.log('You can now interact with VS Code and the function calls will be tracked.')
    
    // Keep the process running
    await new Promise(() => {})
    
  } catch (error) {
    console.error('Error:', error)
    await tracker.close()
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
