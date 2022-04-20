import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("side-bar-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("side-bar-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
