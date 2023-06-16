import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("title-bar-menu-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("title-bar-menu-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener increase:`)
  );
});
