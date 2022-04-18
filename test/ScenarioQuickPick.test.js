import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("QuickPick");
});

afterAll(async () => {
  await runner.kill();
});

// TODO test is flaky, maybe need to force gc
test.skip("QuickPick", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContain(`{
  results: [
    { label: 'before', result: 799 },
    { label: 'after', result: 979 },
    { label: 'before', result: 979 },
    { label: 'after', result: 979 },
    { label: 'before', result: 979 },
    { label: 'after', result: 979 },
    { label: 'before', result: 979 },
    { label: 'after', result: 979 }
  ]
}
`);
});
