import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("explorer-rename-file");
});

afterAll(async () => {
  await runner.kill();
});

test("explorer-rename-file", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
