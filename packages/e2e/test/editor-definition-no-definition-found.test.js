import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-definition-no-definition-found");
});

afterAll(async () => {
  await runner.kill();
});

// TODO quickpick for some reason displays "No matching commands"
test.skip("editor-definition-no-definition-found", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
