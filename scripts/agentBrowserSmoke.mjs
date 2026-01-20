import { execSync } from "node:child_process";

const targetUrl = process.env.AGENT_BROWSER_TARGET_URL || "http://localhost:19006";

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit" });
}

try {
  run(`agent-browser open ${targetUrl}`);
  run("agent-browser snapshot");
  run("agent-browser close");
  console.log("\nAgent Browser smoke test completed.");
} catch (error) {
  console.error("\nAgent Browser smoke test failed.");
  process.exitCode = 1;
}
