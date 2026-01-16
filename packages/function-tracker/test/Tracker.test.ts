import { describe, it, expect, jest } from '@jest/globals'
import { VSCodeFunctionTracker } from '../src/parts/Tracker/Tracker.js'
import { VSCodeTrackerOptions } from '../src/parts/Types/Types.js'

// Simple mock for fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}))

// Simple mock for puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn()
}))

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

  describe('basic functionality', () => {
    it('should have basic methods defined', () => {
      const tracker = new VSCodeFunctionTracker()
      expect(typeof tracker.initialize).toBe('function')
      expect(typeof tracker.close).toBe('function')
      expect(typeof tracker.isInitialized).toBe('function')
      expect(typeof tracker.getFunctionStatistics).toBe('function')
    })
  })
})
