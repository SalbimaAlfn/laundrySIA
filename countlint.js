// Keep CommonJS because this standalone script runs without a module package type.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("node:child_process");
try {
  execSync("node node_modules/eslint/bin/eslint.js .", { encoding: "utf8", stdio: "pipe", maxBuffer: 50 * 1024 * 1024 });
  console.log("OK");
  process.exit(0);
} catch (e) {
  const all = (e.stdout || "") + (e.stderr || "");
  console.log(all);
  process.exit(1);
}
