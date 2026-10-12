import { spawn } from "node:child_process";

const projects = ["chromium", "firefox", "webkit"];
const playwrightCli = "node_modules/@playwright/test/cli.js";

function runProject(project, attempt) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      playwrightCli,
      "test",
      `--project=${project}`,
      "--output",
      `test-results/${project}-attempt-${attempt}`,
    ], {
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

for (const [index, project] of projects.entries()) {
  let passed = false;
  let lastStatus = 1;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    console.log(`\n=== Playwright: ${project} (dados isolados, tentativa ${attempt}/2) ===\n`);
    lastStatus = await runProject(project, attempt);
    if (lastStatus === 0) {
      passed = true;
      break;
    }
    if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  if (!passed) {
    process.exitCode = lastStatus;
    break;
  }

  if (index < projects.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}
