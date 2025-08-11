import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const memoryLeakResultsPath = join(Root.root, '.vscode-memory-leak-finder-results')
