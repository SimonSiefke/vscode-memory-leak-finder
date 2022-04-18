import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("toggle-side-bar");
});

afterAll(async () => {
  await runner.kill();
});

test("toggle-side-bar", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContain(
    expect.stringContaining(`event listener equal:`)
  );
});
