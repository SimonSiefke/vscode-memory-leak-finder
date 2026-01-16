import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { VSCodeFunctionTracker } from '../src/parts/Tracker/Tracker.js'
import { VSCodeTrackerOptions, FunctionStatistics } from '../src/parts/Types/Types.js'

// Mock puppeteer to avoid actual browser launches in tests
const mockPuppeteer = {
  launch: jest.fn()
}

jest.mock('puppeteer', () => mockPuppeteer)

// Mock fs module
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}

jest.mock('fs', () => mockFs)

describe('VSCodeFunctionTracker', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultTracker = new VSCodeFunctionTracker()
      expect(defaultTracker).toBeDefined()
    })

    it('should accept custom options', () => {
      const options: VSCodeTrackerOptions = {
        headless: true,
        devtools: false,
        remoteDebuggingPort: 9333,
        vscodeUrl: 'http://localhost:3000'
      }
      
      const customTracker = new VSCodeFunctionTracker(options)
      expect(customTracker).toBeDefined()
    })
  })

  describe('initialize', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: any
    let mockPage: any

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should initialize successfully when transformed code exists', async () => {
      await tracker.initialize()
      
      expect(mockFs.existsSync).toHaveBeenCalled()
      expect(mockFs.readFileSync).toHaveBeenCalled()
      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: false,
        devtools: true,
        args: [
          '--remote-debugging-port=9222',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })
      expect(mockBrowser.newPage).toHaveBeenCalled()
      expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true)
      expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function))
    })

    it('should throw error when transformed code does not exist', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false)
      
      await expect(tracker.initialize()).rejects.toThrow(
        'Transformed code not found. Run apply-transform.js first.'
      )
    })

    it('should use custom options when initializing', async () => {
      const options: VSCodeTrackerOptions = {
        headless: true,
        devtools: false,
        remoteDebuggingPort: 9333,
        vscodeUrl: 'http://localhost:3000'
      }
      
      const customTracker = new VSCodeFunctionTracker(options)
      await customTracker.initialize()
      
      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        devtools: false,
        args: [
          '--remote-debugging-port=9333',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })
    })
  })

  describe('loadVSCode', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should load VS Code after initialization', async () => {
      await tracker.initialize()
      await tracker.loadVSCode()
      
      expect(mockPage.goto).toHaveBeenCalledWith('http://localhost:8080')
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(5000)
    })

    it('should throw error when not initialized', async () => {
      await expect(tracker.loadVSCode()).rejects.toThrow(
        'Tracker not initialized. Call initialize() first.'
      )
    })

    it('should use custom VS Code URL', async () => {
      const options: VSCodeTrackerOptions = {
        vscodeUrl: 'http://localhost:3000'
      }
      
      const customTracker = new VSCodeFunctionTracker(options)
      await customTracker.initialize()
      await customTracker.loadVSCode()
      
      expect(mockPage.goto).toHaveBeenCalledWith('http://localhost:3000')
    })
  })

  describe('getFunctionStatistics', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should return function statistics', async () => {
      await tracker.initialize()

      const mockStats: FunctionStatistics = {
        'testFunction (test.js:2)': 5,
        'arrowFunction (test.js:6)': 3
      }
      
      mockPage.evaluate = jest.fn().mockResolvedValue(mockStats)
      
      const stats = await tracker.getFunctionStatistics()
      
      expect(stats).toEqual(mockStats)
      expect(mockPage.evaluate).toHaveBeenCalledWith()
    })

    it('should throw error when not initialized', async () => {
      await expect(tracker.getFunctionStatistics()).rejects.toThrow(
        'Tracker not initialized. Call initialize() first.'
      )
    })

    it('should handle empty statistics', async () => {
      await tracker.initialize()

      mockPage.evaluate = jest.fn().mockResolvedValue({})
      
      const stats = await tracker.getFunctionStatistics()
      
      expect(stats).toEqual({})
    })
  })

  describe('resetStatistics', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should reset statistics', async () => {
      await tracker.initialize()

      mockPage.evaluate = jest.fn().mockResolvedValue(undefined)
      
      await tracker.resetStatistics()
      
      expect(mockPage.evaluate).toHaveBeenCalledWith()
    })

    it('should throw error when not initialized', async () => {
      await expect(tracker.resetStatistics()).rejects.toThrow(
        'Tracker not initialized. Call initialize() first.'
      )
    })
  })

  describe('printStatistics', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should print statistics', async () => {
      await tracker.initialize()

      const mockStats: FunctionStatistics = {
        'testFunction (test.js:2)': 5,
        'arrowFunction (test.js:6)': 3,
        'anotherFunction (test.js:10)': 1
      }
      
      mockPage.evaluate = jest.fn().mockResolvedValue(mockStats)
      
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      await tracker.printStatistics()
      
      expect(consoleSpy).toHaveBeenCalledWith('\n=== Function Call Statistics ===')
      expect(mockPage.evaluate).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('close', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should close browser and clean up', async () => {
      await tracker.initialize()
      await tracker.close()
      
      expect(mockBrowser.close).toHaveBeenCalled()
    })

    it('should handle closing when not initialized', async () => {
      await expect(tracker.close()).resolves.not.toThrow()
    })
  })

  describe('isInitialized', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should return false when not initialized', () => {
      expect(tracker.isInitialized()).toBe(false)
    })

    it('should return true when initialized', async () => {
      await tracker.initialize()
      expect(tracker.isInitialized()).toBe(true)
    })

    it('should return false after closing', async () => {
      await tracker.initialize()
      await tracker.close()
      expect(tracker.isInitialized()).toBe(false)
    })
  })

  describe('request interception', () => {
    let tracker: VSCodeFunctionTracker
    let mockBrowser: jest.Mocked<puppeteer.Browser>
    let mockPage: jest.Mocked<puppeteer.Page>

    beforeEach(() => {
      jest.clearAllMocks()
      
      // Create mock browser and page
      mockBrowser = {
        close: jest.fn().mockResolvedValue(undefined),
        newPage: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true)
      } as any

      mockPage = {
        goto: jest.fn().mockResolvedValue(undefined),
        setRequestInterception: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        evaluate: jest.fn(),
        waitForTimeout: jest.fn().mockResolvedValue(undefined)
      } as any

      mockBrowser.newPage = jest.fn().mockResolvedValue(mockPage)
      mockPuppeteer.launch = jest.fn().mockResolvedValue(mockBrowser)
      
      // Mock fs.existsSync and fs.readFileSync
      mockFs.existsSync = jest.fn().mockReturnValue(true)
      mockFs.readFileSync = jest.fn().mockReturnValue('mock transformed code')

      tracker = new VSCodeFunctionTracker()
    })

    afterEach(async () => {
      await tracker.close()
    })

    it('should intercept workbench requests', async () => {
      await tracker.initialize()
      
      // Get the request handler
      const requestHandlerCall = mockPage.on.mock.calls.find(
        call => call[0] === 'request'
      )
      
      expect(requestHandlerCall).toBeDefined()
      expect(requestHandlerCall![1]).toBeInstanceOf(Function)
      
      const requestHandler = requestHandlerCall![1]
      
      // Mock request object
      const mockRequest = {
        url: jest.fn().mockReturnValue('http://localhost:8080/workbench.desktop.main.js'),
        respond: jest.fn(),
        continue: jest.fn()
      }
      
      // Call the handler
      requestHandler(mockRequest)
      
      expect(mockRequest.respond).toHaveBeenCalledWith({
        status: 200,
        contentType: 'application/javascript',
        body: 'mock transformed code'
      })
      expect(mockRequest.continue).not.toHaveBeenCalled()
    })

    it('should continue non-workbench requests', async () => {
      await tracker.initialize()
      
      // Get the request handler
      const requestHandlerCall = mockPage.on.mock.calls.find(
        call => call[0] === 'request'
      )
      
      const requestHandler = requestHandlerCall![1]
      
      // Mock request object
      const mockRequest = {
        url: jest.fn().mockReturnValue('http://localhost:8080/other-script.js'),
        respond: jest.fn(),
        continue: jest.fn()
      }
      
      // Call the handler
      requestHandler(mockRequest)
      
      expect(mockRequest.respond).not.toHaveBeenCalled()
      expect(mockRequest.continue).toHaveBeenCalled()
    })
  })
})
