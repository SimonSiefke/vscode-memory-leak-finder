import { execa } from 'execa'

const exec = async (command) => {
  console.info(command)
  await execa(command, {
    shell: true,
    stdio: 'inherit',
  })
}

// prettier-ignore
const applyLernaBugWorkaround =async  () => {
  // workaround for https://github.com/lerna/lerna/issues/2352
  await exec(`cd packages/page-object && npm ci --prefer-offline && cd ../../`);
  await exec(`cd packages/e2e && npm ci --prefer-offline && cd ../../`);
}

const main = async () => {
  await applyLernaBugWorkaround()
}

main()
