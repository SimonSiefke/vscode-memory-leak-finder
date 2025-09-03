import * as IsWindows from '../IsWindows/IsWindows.ts'

// TODO pass as arguments from parent process
export const AttachToPage = IsWindows.IsWindows ? 5000 : 3000
