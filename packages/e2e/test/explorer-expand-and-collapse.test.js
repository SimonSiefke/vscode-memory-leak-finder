import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("explorer-expand-and-collapse");
});

afterAll(async () => {
  await runner.kill();
});

test("explorer-expand-and-collapse", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
