// Fixture reports must not appear as benchmark results in the enclosing CI job.
// Summary tests explicitly supply their own temporary summary files.
delete process.env.GITHUB_STEP_SUMMARY
