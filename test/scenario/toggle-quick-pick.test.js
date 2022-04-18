import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("toggle-quick-pick");
});

afterAll(async () => {
  await runner.kill();
});

test("toggle-quick-pick", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContain(
    expect.stringContaining(`event listener equal:`)
  );
});
