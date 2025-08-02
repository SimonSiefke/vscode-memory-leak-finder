import { execa } from 'execa'

/**
 * Installs dependencies using npm ci
 * @param {string} cwd - The working directory to run npm ci in
 * @param {boolean} useNice - Whether to use nice command for resource management
 */
export const installDependencies = async (cwd, useNice) => {
  if (useNice) {
    console.log(`Using nice to reduce system resource usage...`)
    await execa('nice', ['-n', '10', 'npm', 'ci'], { cwd })
  } else {
    await execa('npm', ['ci'], { cwd })
  }
}
